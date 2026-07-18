import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { ChevronLeft, Plus, Sparkles, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkillListRow } from "@/components/skills/SkillListRow"
import { SkillListFilters } from "@/components/skills/SkillListFilters"
import { SkillsLanding } from "./SkillsLanding"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 8

const CATEGORY_LABELS: Record<string, string> = {
  TECH: "Tech & Dev", DATA: "Data & AI", DESIGN: "Design & UX", ENGINEERING: "Engineering",
  MARKETING: "Marketing", BUSINESS: "Business", FINANCE: "Finance", LEGAL: "Legal",
  LANGUAGE: "Languages", COACHING: "Coaching", CREATIVE: "Creative", WELLNESS: "Wellness",
}

const SKILL_OPTIONS = ["React", "Next.js", "TypeScript", "Node.js", "Python", "AWS", "Docker", "Figma", "SQL"]

interface PageProps {
  searchParams: {
    q?: string; category?: string; format?: string
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
    searchParams.q || searchParams.category || searchParams.format || searchParams.minRating ||
    searchParams.minPrice || searchParams.maxPrice || searchParams.minExp || searchParams.location || searchParams.skills
  )

  // No filters, no search, first page — show the SkillHub landing/hub page instead of the raw list.
  if (!isFiltered && page === 1) {
    return <SkillsLanding isLoggedIn={!!session} />
  }

  const where: any = { status: "ACTIVE" }
  if (searchParams.q)         where.OR = [{ title: { contains: searchParams.q } }, { tagline: { contains: searchParams.q } }, { description: { contains: searchParams.q } }]
  if (searchParams.category)  where.category    = searchParams.category
  if (searchParams.format)    where.format      = searchParams.format
  if (searchParams.minRating) where.avgRating   = { gte: parseFloat(searchParams.minRating) }
  if (searchParams.minExp)    where.yearsExp    = { gte: parseInt(searchParams.minExp) }
  if (searchParams.maxPrice)  where.hourlyRate  = { lte: parseInt(searchParams.maxPrice) }
  if (searchParams.location)  where.location    = { in: searchParams.location.split(",") }
  if (searchParams.skills) {
    where.AND = searchParams.skills.split(",").map(s => ({ skills: { contains: `"${s}"` } }))
  }

  const orderBy: any = sort === "price_asc"   ? { hourlyRate: "asc" }
                     : sort === "price_desc"  ? { hourlyRate: "desc" }
                     : sort === "rating"      ? [{ avgRating: "desc" }, { reviewCount: "desc" }]
                     : sort === "popular"     ? { totalOrders: "desc" }
                     : sort === "newest"      ? { createdAt: "desc" }
                     : aiMatch                ? [{ isVerified: "desc" }, { isFeatured: "desc" }, { avgRating: "desc" }]
                     : [{ isFeatured: "desc" }, { avgRating: "desc" }]

  const [listings, total, byCategory, locationRows] = await Promise.all([
    prisma.skillListing.findMany({
      where, orderBy,
      skip:  (page - 1) * PAGE_SIZE,
      take:  PAGE_SIZE,
      include: {
        user:   { select: { id: true, name: true, avatarUrl: true, image: true, jobTitle: true, department: true, isVerified: true, company: { select: { name: true, logo: true } } } },
        _count: { select: { orders: true, reviews: true } },
      },
    }),
    prisma.skillListing.count({ where }),
    prisma.skillListing.groupBy({ by: ["category"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    prisma.skillListing.findMany({ where: { status: "ACTIVE", location: { not: null } }, select: { location: true }, distinct: ["location"] }),
  ])

  const categoryCounts = Object.fromEntries(byCategory.map(c => [c.category, c._count._all]))
  const locations       = locationRows.map(r => r.location).filter((l): l is string => !!l).sort()
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/skills" className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-4 w-fit transition-colors">
        <ChevronLeft className="h-3.5 w-3.5" /> All Categories
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{catLabel}</h1>
        <p className="text-sm text-muted-foreground mt-1">{total.toLocaleString()} professionals available</p>
      </div>

      <SkillListFilters categoryCounts={categoryCounts} locations={locations} skillOptions={SKILL_OPTIONS}>
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
              {listings.map((l) => <SkillListRow key={l.id} listing={l as any} />)}
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
  )
}
