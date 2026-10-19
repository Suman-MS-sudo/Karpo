import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { auth } from "@/auth"
import Link from "next/link"
import { ChevronLeft, Plus, Sparkles, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkillListRow } from "@/components/skills/SkillListRow"
import { getWishlistedIds } from "@/lib/wishlist"
import { SkillListFilters } from "@/components/skills/SkillListFilters"
import { SkillsHero } from "@/components/skills/SkillsHero"
import { SkillCategoryStrip } from "@/components/skills/SkillCategoryStrip"
import { SkillsLanding } from "./SkillsLanding"
import { fuzzyFilter } from "@/lib/fuzzy"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Skills",
  description: "Browse and hire skilled professionals for freelance projects, coaching, and consulting, or list your own skills to offer your services.",
}

const PAGE_SIZE = 8

const CATEGORY_LABELS: Record<string, string> = {
  TECH: "Tech & Dev", DATA: "Data & AI", DESIGN: "Design & UX", ENGINEERING: "Engineering",
  MARKETING: "Marketing", BUSINESS: "Business", FINANCE: "Finance",
  LANGUAGE: "Languages", COACHING: "Coaching", CREATIVE: "Creative", WELLNESS: "Wellness",
  MUSIC: "Music", PHOTOGRAPHY: "Photography",
}

// Skill checkboxes in the filter sidebar, per category. "ALL" is the fallback
// when no category is selected.
const SKILL_OPTIONS_BY_CATEGORY: Record<string, string[]> = {
  ALL:         ["React", "Python", "Figma", "SEO", "Financial Modelling", "Public Speaking", "Photography", "Guitar"],
  TECH:        ["React", "Next.js", "TypeScript", "Node.js", "Python", "AWS", "Docker", "SQL"],
  DATA:        ["Python", "SQL", "Machine Learning", "Power BI", "Tableau", "Excel", "Statistics", "Deep Learning"],
  DESIGN:      ["Figma", "UI Design", "UX Research", "Prototyping", "Branding", "Illustration", "Adobe Photoshop", "Motion Design"],
  ENGINEERING: ["AutoCAD", "SolidWorks", "Embedded Systems", "IoT", "PLC", "MATLAB", "Robotics", "CAD/CAM"],
  MARKETING:   ["SEO", "Google Ads", "Social Media", "Content Marketing", "Email Marketing", "Analytics", "Branding", "Copywriting"],
  BUSINESS:    ["Strategy", "Product Management", "Operations", "Sales", "Startups", "Project Management", "Consulting", "Negotiation"],
  FINANCE:     ["Financial Modelling", "Taxation", "Accounting", "Investing", "Budgeting", "Valuation", "Excel", "Audit"],
  LANGUAGE:    ["English", "Hindi", "Spanish", "French", "German", "Japanese", "IELTS", "Public Speaking"],
  COACHING:    ["Career Coaching", "Interview Prep", "Leadership", "Mentoring", "Public Speaking", "Resume Review", "Productivity", "Life Coaching"],
  CREATIVE:    ["Content Writing", "Copywriting", "Editing", "Video Editing", "Storytelling", "Blogging", "Scriptwriting", "Proofreading"],
  WELLNESS:    ["Yoga", "Meditation", "Fitness", "Nutrition", "Mental Health", "Pilates", "Zumba", "Stress Management"],
  MUSIC:       ["Guitar", "Piano", "Vocals", "Music Production", "Carnatic", "Hindustani", "Drums", "Music Theory"],
  PHOTOGRAPHY: ["Portrait", "Wedding", "Product", "Lightroom", "Photoshop", "Videography", "Editing", "Landscape"],
}

// Hourly rate for hourly listings, lowest package price for packaged ones.
function effectivePrice(l: { hourlyRate: number | null; packages: string | null }): number | null {
  if (l.hourlyRate != null) return l.hourlyRate
  try {
    const prices = (JSON.parse(l.packages ?? "[]") as Array<{ price?: number | string }>)
      .map((p) => Number(p.price)).filter((n) => Number.isFinite(n) && n > 0)
    return prices.length ? Math.min(...prices) : null
  } catch { return null }
}

interface PageProps {
  searchParams: {
    q?: string; category?: string; format?: string; pricing?: string
    minPrice?: string; maxPrice?: string; minRating?: string; minExp?: string
    location?: string; skills?: string; ai?: string
    sort?: string; page?: string
  }
}

export default async function SkillsPage({ searchParams }: PageProps) {
  const session = await auth()
  const page    = Math.max(1, parseInt(searchParams.page ?? "1"))
  const sort    = searchParams.sort ?? "featured"
  const aiMatch = searchParams.ai !== "off"

  const isFiltered = !!(
    searchParams.q || searchParams.category || searchParams.format || searchParams.pricing || searchParams.minRating ||
    searchParams.minPrice || searchParams.maxPrice || searchParams.minExp || searchParams.location || searchParams.skills
  )

  // No filters, no search, first page — show the SkillHub landing/hub page instead of the raw list.
  if (!isFiltered && page === 1) {
    return <SkillsLanding isLoggedIn={!!session} />
  }

  const baseWhere: any = { status: "ACTIVE" }
  if (searchParams.category)  baseWhere.category    = searchParams.category
  if (searchParams.format)    baseWhere.format      = searchParams.format
  if (searchParams.minRating) baseWhere.avgRating   = { gte: parseFloat(searchParams.minRating) }
  if (searchParams.minExp)    baseWhere.yearsExp    = { gte: parseInt(searchParams.minExp) }
  // Listings are priced either hourly (hourlyRate) or by package (packages JSON,
  // hourlyRate is null), so a price filter on hourlyRate alone hides every
  // packaged listing. `pricing` narrows to one model; the price filter itself
  // is applied on each listing's effective price (see below).
  const pricing  = searchParams.pricing === "HOURLY" || searchParams.pricing === "PACKAGE" ? searchParams.pricing : ""
  const minPrice = parseInt(searchParams.minPrice ?? "") || 0
  if (pricing) baseWhere.pricingModel = pricing
  const priceSort = sort === "price_asc" || sort === "price_desc"
  // Hourly-only can be filtered/sorted in SQL; anything that can include
  // packaged listings has to be done in memory over a bounded pool.
  const memPrice = pricing !== "HOURLY" && (minPrice > 0 || priceSort)
  if (pricing === "HOURLY" && minPrice > 0) baseWhere.hourlyRate = { gte: minPrice }
  // Collect extra AND-conditions here instead of assigning `baseWhere.OR` /
  // `baseWhere.AND` directly — the text-search branch below also needs its
  // own top-level `OR`, and a second assignment would silently clobber it.
  const andConditions: any[] = []

  // Only filter by location when the user explicitly picks one. Skills are
  // often remote/unlocated, and the category strip counts are global, so an
  // implicit "my city" default made category pages show fewer (or no)
  // listings than the count on the category chip.
  if (searchParams.location) {
    baseWhere.location = { in: searchParams.location.split(",") }
  }
  if (searchParams.skills) {
    andConditions.push(...searchParams.skills.split(",").map(s => ({ skills: { contains: `"${s}"` } })))
  }
  if (andConditions.length) baseWhere.AND = andConditions

  const q = searchParams.q?.trim()
  const where: any = q ? {
    ...baseWhere,
    OR: [
      { title:       { contains: q } },
      { tagline:     { contains: q } },
      { description: { contains: q } },
      { subcategory: { contains: q } },
    ],
  } : baseWhere

  const orderBy: any = sort === "price_asc"   ? { hourlyRate: "asc" }
                     : sort === "price_desc"  ? { hourlyRate: "desc" }
                     : sort === "rating"      ? [{ avgRating: "desc" }, { reviewCount: "desc" }]
                     : sort === "popular"     ? { totalOrders: "desc" }
                     : sort === "newest"      ? { createdAt: "desc" }
                     : aiMatch                ? [{ isVerified: "desc" }, { isFeatured: "desc" }, { avgRating: "desc" }]
                     : [{ isFeatured: "desc" }, { avgRating: "desc" }]

  const listingInclude = {
    user:   { select: { id: true, name: true, avatarUrl: true, image: true, jobTitle: true, department: true, isVerified: true, company: { select: { name: true, logo: true } } } },
    _count: { select: { orders: true, reviews: true } },
  } as const

  let listings: any[], total: number

  if (memPrice) {
    const pool = await prisma.skillListing.findMany({ where, orderBy: { createdAt: "desc" }, take: 500, include: listingInclude })
    const withPrice = pool.map((l) => ({ l, price: effectivePrice(l) }))
    let kept = withPrice.filter((x) => minPrice <= 0 || (x.price !== null && x.price >= minPrice))
    if (priceSort) {
      const dir = sort === "price_asc" ? 1 : -1
      kept = kept.sort((a, b) => ((a.price ?? Infinity) - (b.price ?? Infinity)) * dir)
    }
    total = kept.length
    listings = kept.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((x) => x.l)
  } else if (q) {
    // Exact substring match first; if a typo yields nothing, fall back to a
    // fuzzy (typo-tolerant) match over a bounded candidate pool — same
    // pattern used for rentals search.
    const exactCount = await prisma.skillListing.count({ where })
    if (exactCount > 0) {
      listings = await prisma.skillListing.findMany({
        where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: listingInclude,
      })
      total = exactCount
    } else {
      const candidates = await prisma.skillListing.findMany({
        where: baseWhere, orderBy, take: 500, include: listingInclude,
      })
      const matched = fuzzyFilter(candidates, q, (l) => [l.title, l.tagline, l.description, l.subcategory])
      total = matched.length
      listings = matched.slice((page - 1) * PAGE_SIZE, (page - 1) * PAGE_SIZE + PAGE_SIZE)
    }
  } else {
    ;[listings, total] = await Promise.all([
      prisma.skillListing.findMany({
        where, orderBy, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, include: listingInclude,
      }),
      prisma.skillListing.count({ where }),
    ])
  }

  const wishlistedIds = await getWishlistedIds(session?.user?.id, "SKILL")

  // allActiveCount/verifiedUsers-count/orderAgg/ratingAgg folded into one
  // raw round trip — see SkillsLanding.tsx for why (libsql adapter doesn't
  // pipeline concurrent requests). groupBy/locationRows stay separate since
  // they return multi-row shapes.
  const statsQuery = prisma.$queryRaw<Array<{
    allActiveCount: bigint; completedOrders: bigint; avgRating: number | null; verifiedCount: bigint
  }>>(Prisma.sql`
    SELECT
      (SELECT COUNT(*) FROM "SkillListing" WHERE status = 'ACTIVE') AS "allActiveCount",
      (SELECT COALESCE(SUM("completedOrders"),0) FROM "SkillListing" WHERE status = 'ACTIVE') AS "completedOrders",
      (SELECT AVG("avgRating") FROM "SkillListing" WHERE status = 'ACTIVE' AND "reviewCount" > 0) AS "avgRating",
      (SELECT COUNT(DISTINCT "userId") FROM "SkillListing" WHERE status = 'ACTIVE') AS "verifiedCount"
  `).then(([r]) => ({
    allActiveCount: Number(r.allActiveCount),
    completedOrders: Number(r.completedOrders),
    avgRating: r.avgRating,
    verifiedCount: Number(r.verifiedCount),
  }))

  const [byCategory, locationRows, stats] = await Promise.all([
    prisma.skillListing.groupBy({ by: ["category"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.skillListing.groupBy({ by: ["location"], where: { status: "ACTIVE", location: { not: null } }, _count: { _all: true } }),
    statsQuery,
  ])
  const { allActiveCount, completedOrders: orderAggSum, avgRating: ratingAggAvg, verifiedCount } = stats

  // Skills / Topics checkboxes: the tags posters actually entered for this
  // category (most common first), so every option returns results. The curated
  // list only tops up when there are few real tags.
  const skillRows = await prisma.skillListing.findMany({
    where: { status: "ACTIVE", ...(searchParams.category ? { category: searchParams.category } : {}) },
    select: { skills: true },
  })
  const tagCounts = new Map<string, { label: string; n: number }>()
  for (const r of skillRows) {
    let tags: unknown
    try { tags = JSON.parse(r.skills || "[]") } catch { continue }
    if (!Array.isArray(tags)) continue
    for (const t of tags) {
      const label = typeof t === "string" ? t.trim() : ""
      if (!label) continue
      const key = label.toLowerCase()
      const cur = tagCounts.get(key)
      if (cur) cur.n++; else tagCounts.set(key, { label, n: 1 })
    }
  }
  const skillOptions = [...tagCounts.values()].sort((a, b) => b.n - a.n || a.label.localeCompare(b.label)).slice(0, 15).map((t) => t.label)
  if (skillOptions.length < 6) {
    const have = new Set(skillOptions.map((s) => s.toLowerCase()))
    for (const s of SKILL_OPTIONS_BY_CATEGORY[searchParams.category ?? "ALL"] ?? SKILL_OPTIONS_BY_CATEGORY.ALL) {
      if (skillOptions.length >= 8) break
      if (!have.has(s.toLowerCase())) skillOptions.push(s)
    }
  }

  const categoryCounts = Object.fromEntries(byCategory.map(c => [c.category, c._count._all]))
  const locations       = locationRows.map(r => r.location).filter((l): l is string => !!l).sort()
  const topLocations    = [...locationRows]
    .filter((r): r is typeof r & { location: string } => !!r.location)
    .sort((a, b) => b._count._all - a._count._all || a.location.localeCompare(b.location))
    .slice(0, 5)
    .map(r => r.location)
  const pages            = Math.ceil(total / PAGE_SIZE)
  const catLabel          = searchParams.category ? CATEGORY_LABELS[searchParams.category] ?? searchParams.category : "All Skills"

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    const { page: _, ...rest } = searchParams
    Object.entries(rest).forEach(([k, v]) => { if (v) params.set(k, v) })
    if (p > 1) params.set("page", String(p))
    return `/skills?${params.toString()}`
  }

  return (
    <div className="min-h-full bg-background">
      <SkillsHero
        totalListings={allActiveCount}
        verifiedCount={verifiedCount}
        completedProjects={orderAggSum}
        avgRating={ratingAggAvg}
        isLoggedIn={!!session}
        defaultQuery={searchParams.q ?? ""}
        compact
      />
      <SkillCategoryStrip activeCategory={searchParams.category ?? "All"} counts={categoryCounts} total={allActiveCount} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/skills" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4 w-fit transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" /> All Categories
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{catLabel}</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} professionals available</p>
      </div>

      <SkillListFilters locations={locations} topLocations={topLocations} skillOptions={skillOptions}>
        {aiMatch && (
          <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent ring-1 ring-primary/20 px-5 py-4 mb-6">
            <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">AI Matched Results</p>
              <p className="text-xs text-muted-foreground">Based on verified reputation and your filters</p>
            </div>
          </div>
        )}

        {listings.length > 0 ? (
          <>
            <div className="space-y-3">
              {listings.map((l) => (
                <SkillListRow
                  key={l.id}
                  listing={l as any}
                  isWishlisted={wishlistedIds.has(l.id)}
                  isOwn={session?.user?.id === (l as any).userId}
                />
              ))}
            </div>

            {pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-1.5">
                {page > 1 && <Link href={pageUrl(page - 1)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-card ring-1 ring-border/60 text-sm hover:ring-primary/30 hover:shadow-md transition-all"><ChevronLeft className="h-4 w-4" /></Link>}
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  const p = page <= 4 ? i + 1 : page - 3 + i
                  if (p < 1 || p > pages) return null
                  return (
                    <Link key={p} href={pageUrl(p)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-medium transition-all ${p === page ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "bg-card ring-1 ring-border/60 hover:ring-primary/30 hover:shadow-md"}`}>{p}</Link>
                  )
                })}
                {page < pages && <Link href={pageUrl(page + 1)} className="h-9 w-9 flex items-center justify-center rounded-xl bg-card ring-1 ring-border/60 text-sm hover:ring-primary/30 hover:shadow-md transition-all rotate-180"><ChevronLeft className="h-4 w-4" /></Link>}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 rounded-3xl bg-card/50 ring-1 ring-border/60">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="font-semibold">No listings found</p>
            <p className="text-sm mt-1 text-muted-foreground">Try different filters or be the first to list in this category!</p>
            {session && (
              <Button asChild className="mt-5 gap-2 shadow-lg shadow-primary/20"><Link href="/skills/new"><Plus className="h-4 w-4" />List Your Skill</Link></Button>
            )}
          </div>
        )}

        {/* Can't find match CTA */}
        <div className="flex items-center gap-4 rounded-2xl bg-card ring-1 ring-border/60 shadow-sm px-5 py-4 mt-8">
          <div className="flex-1">
            <p className="text-sm font-semibold">Can&apos;t find the right match?</p>
            <p className="text-xs text-muted-foreground mt-0.5">List your own request and let professionals reach out to you.</p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link href="/skills/new">Post a request</Link>
          </Button>
        </div>
      </SkillListFilters>
      </div>
    </div>
  )
}
