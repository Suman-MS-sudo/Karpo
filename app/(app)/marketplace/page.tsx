import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { Plus, TrendingUp, ChevronLeft, ChevronRight, Zap } from "lucide-react"
import { FREE_LIMITS } from "@/lib/limits"
import { Button } from "@/components/ui/button"
import { ListingCard } from "@/components/shared/ListingCard"
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters"

const PAGE_SIZE = 24

interface PageProps {
  searchParams: {
    q?: string
    category?: string
    condition?: string
    minPrice?: string
    maxPrice?: string
    city?: string
    negotiable?: string
    sort?: string
    page?: string
  }
}

function buildPageUrl(searchParams: PageProps["searchParams"], page: number) {
  const params = new URLSearchParams()
  Object.entries(searchParams).forEach(([k, v]) => { if (v && k !== "page") params.set(k, v) })
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return `/marketplace${qs ? `?${qs}` : ""}`
}

export default async function MarketplacePage({ searchParams }: PageProps) {
  const session = await auth()
  const now     = new Date()
  const page    = Math.max(1, parseInt(searchParams.page ?? "1"))

  // ── Build base where clause ───────────────────────────────────────────────
  const baseWhere = {
    status: "ACTIVE" as const,
    ...(searchParams.q ? {
      OR: [
        { title: { contains: searchParams.q } },
        { description: { contains: searchParams.q } },
      ],
    } : {}),
    ...(searchParams.category ? { category: searchParams.category } : {}),
    ...(searchParams.condition ? { condition: searchParams.condition } : {}),
    ...(searchParams.city ? { city: searchParams.city } : {}),
    ...(searchParams.negotiable ? { isNegotiable: true } : {}),
    ...(searchParams.minPrice || searchParams.maxPrice ? {
      price: {
        ...(searchParams.minPrice ? { gte: parseInt(searchParams.minPrice) } : {}),
        ...(searchParams.maxPrice ? { lte: parseInt(searchParams.maxPrice) } : {}),
      },
    } : {}),
  }

  // ── Featured section: SUPER + FEATURED boosts still active ────────────────
  const featuredListings = searchParams.q ? [] : await prisma.listing.findMany({
    where: {
      ...baseWhere,
      boostLevel: { in: ["SUPER", "FEATURED"] },
      boostExpiresAt: { gt: now },
    },
    orderBy: { boostExpiresAt: "desc" },
    take: 4,
    include: { user: { include: { company: { select: { name: true, logo: true, domain: true } }, membership: { select: { plan: true } } } } },
  })

  const featuredIds = featuredListings.map((l) => l.id)

  // ── Sort order ─────────────────────────────────────────────────────────────
  const sortMap = {
    price_asc:  [{ price: "asc" as const }],
    price_desc: [{ price: "desc" as const }],
    views:      [{ viewCount: "desc" as const }, { createdAt: "desc" as const }],
    boosted:    [{ isBoosted: "desc" as const }, { createdAt: "desc" as const }],
    newest:     [{ createdAt: "desc" as const }],
  }
  const orderBy = sortMap[(searchParams.sort as keyof typeof sortMap) ?? "newest"] ??
    [{ isBoosted: "desc" as const }, { createdAt: "desc" as const }]

  // ── Main grid listings (exclude featured dupes, with pagination) ──────────
  const gridWhere = {
    ...baseWhere,
    ...(featuredIds.length ? { NOT: { id: { in: featuredIds } } } : {}),
  }

  const [listings, gridTotal] = await Promise.all([
    prisma.listing.findMany({
      where: gridWhere,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { include: { company: { select: { name: true, logo: true, domain: true } }, membership: { select: { plan: true } } } } },
    }),
    prisma.listing.count({ where: gridWhere }),
  ])

  const totalPages  = Math.ceil(gridTotal / PAGE_SIZE)
  const totalCount  = featuredListings.length + gridTotal
  const isPremium = session?.user?.membershipPlan === "PREMIUM"
  const myListingsCount = session?.user?.id && !isPremium
    ? await prisma.listing.count({ where: { userId: session.user.id, status: "ACTIVE" } })
    : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold">Buy &amp; Sell</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {totalCount > 0
              ? `${totalCount} listing${totalCount === 1 ? "" : "s"}${searchParams.city ? ` in ${searchParams.city}` : ""}`
              : "Verified sellers from your corporate network"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isPremium && session?.user?.id && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">{myListingsCount}/{FREE_LIMITS.marketplace} listed</span>
              <Link href="/membership" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline"><Zap className="h-3 w-3" />Upgrade</Link>
            </div>
          )}
          <Button asChild>
            <Link href="/marketplace/new"><Plus className="h-4 w-4" /> Post Item</Link>
          </Button>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <MarketplaceFilters current={searchParams} />

      {/* ── Featured / Boosted section ─────────────────────────────────────── */}
      {featuredListings.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <h2 className="font-semibold text-sm uppercase tracking-wide text-amber-700 dark:text-amber-400">Featured Listings</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featuredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                id={listing.id}
                href={`/marketplace/${listing.id}`}
                title={listing.title}
                subtitle={listing.description}
                price={listing.price}
                images={listing.images}
                author={listing.user}
                badge={listing.category}
                city={listing.city}
                createdAt={listing.createdAt}
                condition={listing.condition}
                isNegotiable={listing.isNegotiable}
                boostLevel={listing.boostLevel}
                viewCount={listing.viewCount}
                serviceBorderColor="border-l-amber-400"
                isOwn={listing.userId === session?.user?.id}
                listingId={listing.id}
              />
            ))}
          </div>
          <div className="mt-3 h-px bg-gradient-to-r from-amber-200 dark:from-amber-800 via-border to-transparent" />
        </section>
      )}

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      {listings.length === 0 && featuredListings.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <h3 className="text-xl font-semibold mb-2">No listings found</h3>
          <p className="text-muted-foreground mb-6 text-sm">
            {searchParams.q ? `No results for "${searchParams.q}"` : "Be the first to list something!"}
          </p>
          <Button asChild><Link href="/marketplace/new">Post First Item</Link></Button>
        </div>
      ) : (
        <>
          {listings.length > 0 && (
            <>
              {featuredListings.length > 0 && (
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">
                  All listings
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    href={`/marketplace/${listing.id}`}
                    title={listing.title}
                    subtitle={listing.description}
                    price={listing.price}
                    images={listing.images}
                    author={listing.user}
                    badge={listing.category}
                    city={listing.city}
                    createdAt={listing.createdAt}
                    condition={listing.condition}
                    isNegotiable={listing.isNegotiable}
                    boostLevel={listing.boostLevel}
                    viewCount={listing.viewCount}
                    serviceBorderColor="border-l-blue-400"
                    isOwn={listing.userId === session?.user?.id}
                    listingId={listing.id}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* ── Pagination ────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Link
            href={buildPageUrl(searchParams, page - 1)}
            aria-disabled={page <= 1}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              page <= 1
                ? "pointer-events-none opacity-40 border-border text-muted-foreground"
                : "border-border hover:bg-muted text-foreground"
            }`}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </Link>

          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…")
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-2 text-sm text-muted-foreground">…</span>
                ) : (
                  <Link
                    key={p}
                    href={buildPageUrl(searchParams, p as number)}
                    className={`h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-foreground text-background"
                        : "border border-border hover:bg-muted text-foreground"
                    }`}
                  >
                    {p}
                  </Link>
                )
              )}
          </div>

          <Link
            href={buildPageUrl(searchParams, page + 1)}
            aria-disabled={page >= totalPages}
            className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              page >= totalPages
                ? "pointer-events-none opacity-40 border-border text-muted-foreground"
                : "border-border hover:bg-muted text-foreground"
            }`}
          >
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {totalPages > 1 && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          Page {page} of {totalPages} · {gridTotal} listings
        </p>
      )}

      {/* ── Boost CTA banner ──────────────────────────────────────────────── */}
      <div className="mt-12 rounded-2xl bg-gradient-to-r from-blue-50 dark:from-blue-950/40 to-purple-50 dark:to-purple-950/40 border border-blue-100 dark:border-blue-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-base">Want more visibility for your listing?</p>
          <p className="text-sm text-muted-foreground mt-1">
            Boost to the Featured section and get 5× more views. Starting at ₹49 for 7 days.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 border-blue-200 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50">
          <Link href="/marketplace/new">Post &amp; Boost →</Link>
        </Button>
      </div>
    </div>
  )
}
