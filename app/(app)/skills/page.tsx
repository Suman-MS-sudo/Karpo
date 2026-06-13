import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { Plus, Sparkles, TrendingUp, Users, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SkillCard } from "@/components/skills/SkillCard"
import { SkillFilters } from "@/components/skills/SkillFilters"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 20

interface PageProps {
  searchParams: {
    q?: string; category?: string; format?: string
    minPrice?: string; maxPrice?: string; minRating?: string
    sort?: string; page?: string
  }
}

export default async function SkillsPage({ searchParams }: PageProps) {
  const session = await auth()
  const page    = Math.max(1, parseInt(searchParams.page ?? "1"))
  const sort    = searchParams.sort ?? "featured"

  const where: any = { status: "ACTIVE" }
  if (searchParams.q)        where.OR = [{ title: { contains: searchParams.q, mode: "insensitive" } }, { tagline: { contains: searchParams.q, mode: "insensitive" } }, { description: { contains: searchParams.q, mode: "insensitive" } }]
  if (searchParams.category) where.category    = searchParams.category
  if (searchParams.format)   where.format      = searchParams.format
  if (searchParams.minRating) where.avgRating  = { gte: parseFloat(searchParams.minRating) }

  const orderBy: any = sort === "price_asc"   ? { hourlyRate: "asc" }
                     : sort === "price_desc"  ? { hourlyRate: "desc" }
                     : sort === "rating"      ? [{ avgRating: "desc" }, { reviewCount: "desc" }]
                     : sort === "popular"     ? { totalOrders: "desc" }
                     : sort === "newest"      ? { createdAt: "desc" }
                     : [{ isFeatured: "desc" }, { avgRating: "desc" }]

  const [listings, total, featured, stats] = await Promise.all([
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
    // Featured heroes (top 4)
    page === 1 && !searchParams.q && !searchParams.category ? prisma.skillListing.findMany({
      where: { status: "ACTIVE", isFeatured: true },
      take: 4,
      include: { user: { select: { id: true, name: true, avatarUrl: true, image: true, jobTitle: true, department: true, isVerified: true, company: { select: { name: true, logo: true } } } }, _count: { select: { orders: true, reviews: true } } },
    }) : Promise.resolve(null),
    // Platform stats
    page === 1 && !searchParams.q ? prisma.skillListing.aggregate({
      where: { status: "ACTIVE" },
      _count: { id: true },
      _sum:   { completedOrders: true },
    }) : Promise.resolve(null),
  ])

  const pages      = Math.ceil(total / PAGE_SIZE)
  const isFiltered = !!(searchParams.q || searchParams.category || searchParams.format || searchParams.minRating || searchParams.minPrice)

  function pageUrl(p: number) {
    const params = new URLSearchParams()
    const { page: _, ...rest } = searchParams
    Object.entries(rest).forEach(([k, v]) => { if (v) params.set(k, v) })
    if (p > 1) params.set("page", String(p))
    return `/skills?${params.toString()}`
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Hero */}
      {page === 1 && !isFiltered && (
        <div className="mb-10">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold">Skill Marketplace</h1>
              <p className="text-muted-foreground mt-1">Hire expertise from your colleagues. Offer yours.</p>
            </div>
            {session && (
              <Button asChild className="gap-2 shrink-0">
                <Link href="/skills/new"><Plus className="h-4 w-4" />List My Skill</Link>
              </Button>
            )}
          </div>

          {/* Platform stats */}
          {stats && (
            <div className="grid grid-cols-3 gap-4 mt-6 mb-8">
              {[
                { icon: Users,    label: "Active Listings",   value: String(stats._count.id) },
                { icon: Star,     label: "Total Jobs Done",    value: String(stats._sum.completedOrders ?? 0) },
                { icon: TrendingUp, label: "Avg. Seller Rating", value: "4.8 ★" },
              ].map((s) => (
                <div key={s.label} className="bg-card border border-border rounded-2xl p-5 text-center">
                  <s.icon className="h-5 w-5 text-primary-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Featured section */}
          {featured && featured.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />Featured Experts
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {featured.map((l) => <SkillCard key={l.id} listing={l as any} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-3 -mx-4 px-4 sm:-mx-6 sm:px-6 border-b border-border">
        <SkillFilters />
      </div>

      {/* Grid */}
      {listings.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {isFiltered ? `${total} result${total !== 1 ? "s" : ""}` : `All ${total} skill listing${total !== 1 ? "s" : ""}`}
            </p>
            {!session && (
              <Link href="/skills/new" className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" />List your skill
              </Link>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {listings.map((l) => <SkillCard key={l.id} listing={l as any} />)}
          </div>
        </>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Sparkles className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-semibold">No listings found</p>
          <p className="text-sm mt-1">Try different filters or be the first to list in this category!</p>
          {session && (
            <Button asChild className="mt-4 gap-2"><Link href="/skills/new"><Plus className="h-4 w-4" />List Your Skill</Link></Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {page > 1 && <Link href={pageUrl(page - 1)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/50 transition-colors">← Previous</Link>}
          {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page - 3 + i
            if (p < 1 || p > pages) return null
            return (
              <Link key={p} href={pageUrl(p)} className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm transition-colors ${p === page ? "bg-primary-600 text-white font-semibold" : "border border-border hover:bg-muted/50"}`}>{p}</Link>
            )
          })}
          {page < pages && <Link href={pageUrl(page + 1)} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-muted/50 transition-colors">Next →</Link>}
        </div>
      )}
    </div>
  )
}
