export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import Link from "next/link"
import {
  Plus, MessageSquare, MapPin, ArrowRight, Flag,
  Bell, FileText, Heart, ThumbsUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ListingCard } from "@/components/shared/ListingCard"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { getInitials, cn } from "@/lib/utils"
import { ServiceHeroCards } from "@/components/dashboard/ServiceHeroCards"
import { CategoryStrip } from "@/components/shared/CategoryStrip"
import { DashboardSearchBar } from "@/components/dashboard/DashboardSearchBar"
import { MobileDashboardHeader } from "@/components/dashboard/MobileDashboardHeader"
import { DashboardRefresh } from "@/components/dashboard/DashboardRefresh"
import { PostPickerButton } from "@/components/shared/PostPickerButton"
import { ServiceIconGrid } from "@/components/dashboard/ServiceIconGrid"
import type { WishlistItemType } from "@/lib/wishlist"

export const metadata: Metadata = { title: "Dashboard" }

const SERVICE_IMAGE_MAP: Record<string, string> = {
  "buy-sell": "/images/services/marketplace.jpeg",
  rentals: "/images/services/rentals.jpeg",
  "job-referrals": "/images/services/job-referrals.jpeg",
  carpool: "/images/services/carpool.jpeg",
  services: "/images/services/skills.jpeg",
  deals: "/images/services/deals.png",
  events: "/images/services/events.png",
}


export default async function DashboardPage() {
  const session  = await auth()
  const userId   = session!.user!.id
  const userCity = session!.user!.city

  const cityFilter = userCity ? { city: userCity } : {}
  const locationFilter = userCity ? { location: userCity } : {}

  const authorSelect = {
    id: true, name: true, image: true, avatarUrl: true, isVerified: true,
    jobTitle: true, department: true,
    company: { select: { name: true, logo: true, domain: true } },
  } as const

  // All the dashboard's counts/sums collapsed into one round trip. Each of
  // these used to be its own prisma.count()/aggregate() call inside the
  // Promise.all below — that looked parallel, but the libsql adapter doesn't
  // pipeline concurrent requests (verified: 16 queries via Promise.all took
  // ~580ms against this DB, vs ~40ms for the same 16 done as one round trip)
  // so every extra query here was ~30ms of pure network latency added to
  // every single dashboard load. One raw query with scalar subqueries gets
  // the exact same numbers in one round trip instead of ten.
  const now = new Date()
  const cityCond      = userCity ? Prisma.sql`AND city = ${userCity}` : Prisma.empty
  const locationCond  = userCity ? Prisma.sql`AND location = ${userCity}` : Prisma.empty
  const fromLocCond   = userCity ? Prisma.sql`AND "fromLocation" = ${userCity}` : Prisma.empty

  const countsQuery = prisma.$queryRaw<Array<{
    myListingsCount: bigint; myMessages: bigint; viewsSum: bigint
    marketplaceCount: bigint; rentalCount: bigint; referralCount: bigint
    carpoolCount: bigint; skillCount: bigint; dealCount: bigint; eventCount: bigint
  }>>(Prisma.sql`
    SELECT
      (SELECT COUNT(*) FROM "Listing" WHERE "userId" = ${userId} AND status = 'ACTIVE') AS "myListingsCount",
      (SELECT COUNT(*) FROM "Message" WHERE "receiverId" = ${userId} AND "isRead" = 0) AS "myMessages",
      (SELECT COALESCE(SUM("viewCount"),0) FROM "Listing" WHERE "userId" = ${userId}) AS "viewsSum",
      (SELECT COUNT(*) FROM "Listing" WHERE status = 'ACTIVE' ${cityCond}) AS "marketplaceCount",
      (SELECT COUNT(*) FROM "RentalPost" WHERE status = 'ACTIVE' ${cityCond}) AS "rentalCount",
      (SELECT COUNT(*) FROM "JobReferral" WHERE status = 'OPEN' ${locationCond}) AS "referralCount",
      (SELECT COUNT(*) FROM "CarpoolRoute" WHERE "isActive" = 1 ${fromLocCond}) AS "carpoolCount",
      (SELECT COUNT(*) FROM "SkillListing" WHERE status = 'ACTIVE' ${locationCond}) AS "skillCount",
      (SELECT COUNT(*) FROM "Deal" WHERE "isActive" = 1 AND "validUntil" >= ${now}) AS "dealCount",
      (SELECT COUNT(*) FROM "Event" WHERE "isActive" = 1 AND date >= ${now} ${locationCond}) AS "eventCount"
  `).then(([r]) => ({
    myListingsCount:  Number(r.myListingsCount),
    myMessages:       Number(r.myMessages),
    viewsSum:         Number(r.viewsSum),
    marketplaceCount: Number(r.marketplaceCount),
    rentalCount:      Number(r.rentalCount),
    referralCount:    Number(r.referralCount),
    carpoolCount:     Number(r.carpoolCount),
    skillCount:       Number(r.skillCount),
    dealCount:        Number(r.dealCount),
    eventCount:       Number(r.eventCount),
  }))

  // The "recent activity" feed used to run 6 separate findMany calls (one
  // per module, each with a join for the author/company) then merge+sort in
  // JS. Mathematically, a global top-6-by-createdAt can only ever contain
  // rows that are themselves in their own table's top-6-by-createdAt — so a
  // single UNION ALL of each table's top-6 candidates, globally sorted and
  // re-sliced to 6, is exactly equivalent to the old per-table-then-merge
  // approach, just in one round trip instead of six. Formatting (title
  // composition, price labels) is deliberately kept in JS, not SQL — this
  // Turso/libsql setup fails on any computed SQL expression (CASE/COALESCE/
  // string concat) that can yield NULL against a NOT-NULL-typed column, so
  // every branch below selects only raw passthrough columns.
  type RecentRow = {
    kind: string; id: string; col1: string; col2: string | null; col3: string | null
    price: bigint | number | null; badge: string; images: string | null; city: string | null
    createdAt: Date | string; authorId: string
  }
  const recentQuery = prisma.$queryRaw<RecentRow[]>`
    SELECT * FROM (
      SELECT 'LISTING' AS kind, id, title AS col1, description AS col2, NULL AS col3, price, category AS badge, images, city, "createdAt" AS "createdAt", "userId" AS "authorId"
      FROM "Listing" WHERE status = 'ACTIVE' ${cityCond}
      UNION ALL
      SELECT 'RENTAL', id, title, description, NULL, rent, 'RENTAL', images, city, "createdAt", "userId"
      FROM "RentalPost" WHERE status = 'ACTIVE' ${cityCond}
      UNION ALL
      SELECT 'REFERRAL', id, title, description, NULL, "salaryMin", 'REFERRAL', NULL, location, "createdAt", "userId"
      FROM "JobReferral" WHERE status = 'OPEN' ${locationCond}
      UNION ALL
      SELECT 'CARPOOL', id, "fromLocation", "toLocation", "departureTime", "pricePerSeat", 'CARPOOL', NULL, "fromLocation", "createdAt", "userId"
      FROM "CarpoolRoute" WHERE "isActive" = 1 ${fromLocCond}
      UNION ALL
      SELECT 'SKILL', id, title, tagline, description, "hourlyRate", 'SKILL', NULL, location, "createdAt", "userId"
      FROM "SkillListing" WHERE status = 'ACTIVE' ${locationCond}
      UNION ALL
      SELECT 'EVENT', id, title, description, NULL, fee, 'EVENT', images, location, "createdAt", "organizerId"
      FROM "Event" WHERE "isActive" = 1 AND date >= ${now} ${locationCond}
    )
    ORDER BY "createdAt" DESC
    LIMIT 6
  `

  const [recentRows, counts] = await Promise.all([recentQuery, countsQuery])

  const {
    myListingsCount, myMessages, viewsSum: totalViews,
    marketplaceCount, rentalCount, referralCount, carpoolCount, skillCount, dealCount, eventCount,
  } = counts

  function parseImages(raw: string | null | undefined): string[] {
    if (!raw) return []
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] } catch { return [] }
  }

  type Author = Awaited<ReturnType<typeof prisma.user.findMany<{ select: typeof authorSelect }>>>[number]
  type RecentItem = {
    id: string; href: string; title: string; subtitle?: string
    price?: number; priceLabel?: string; images: string[]
    author: Author
    badge: string; city: string | null; createdAt: Date
    wishlistItemType: WishlistItemType
  }

  const HREF_BY_KIND: Record<string, string> = {
    LISTING: "marketplace", RENTAL: "rentals", REFERRAL: "referrals",
    CARPOOL: "carpool", SKILL: "skills", EVENT: "events",
  }
  const authorIds = [...new Set(recentRows.map((r) => r.authorId))]
  const authors = authorIds.length
    ? await prisma.user.findMany({ where: { id: { in: authorIds } }, select: authorSelect })
    : []
  const authorById = new Map(authors.map((a) => [a.id, a]))

  // All of this user's wishlisted item keys, so the recent-activity feed's
  // hearts (which span several post types) show the right saved state.
  const wishlistRows = await prisma.wishlist.findMany({ where: { userId }, select: { itemType: true, itemId: true } })
  const wishlistedKeys = new Set(wishlistRows.map((w) => `${w.itemType}:${w.itemId}`))

  // authorId always references an existing user (foreign key, no orphaned
  // rows in practice) — filter defensively rather than assert non-null.
  const recentListings: RecentItem[] = recentRows.flatMap((r): RecentItem[] => {
    const author = authorById.get(r.authorId)
    if (!author) return []
    const price = r.price === null || r.price === undefined ? null : Number(r.price)
    let title = r.col1, subtitle: string | undefined = r.col2 ?? undefined
    let finalPrice: number | undefined = price ?? undefined
    let priceLabel: string | undefined

    if (r.kind === "RENTAL") {
      priceLabel = "/mo"
    } else if (r.kind === "REFERRAL") {
      finalPrice = price ?? undefined
      priceLabel = price ? "+/yr" : undefined
    } else if (r.kind === "CARPOOL") {
      title = `${r.col1} → ${r.col2}`
      subtitle = `Departs ${r.col3}`
      priceLabel = "/seat"
    } else if (r.kind === "SKILL") {
      subtitle = r.col2 ?? r.col3 ?? undefined
      finalPrice = price ?? undefined
      priceLabel = price ? "/hr" : undefined
    } else if (r.kind === "EVENT") {
      finalPrice = price && price > 0 ? price : undefined
    }

    return [{
      id: r.id,
      href: `/${HREF_BY_KIND[r.kind]}/${r.id}`,
      title, subtitle,
      price: finalPrice, priceLabel,
      images: parseImages(r.images),
      author,
      badge: r.badge,
      city: r.city,
      createdAt: new Date(r.createdAt),
      wishlistItemType: r.kind as WishlistItemType,
    }]
  })

  const hour = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false })
  const greeting = Number(hour) < 12 ? "Good morning" : Number(hour) < 17 ? "Good afternoon" : "Good evening"

  const QUICK_ACTIONS = [
    { label: "Post listing", href: null as string | null, icon: Plus },
    { label: "Messages", href: "/messages", icon: MessageSquare, badge: myMessages },
    { label: "My postings", href: "/my-postings", icon: FileText },
    { label: "Wishlist", href: "/wishlist", icon: Heart },
    { label: "My Interests", href: "/my-interests", icon: ThumbsUp },
    { label: "Notifications", href: "/notifications", icon: Bell },
  ]

  const SERVICE_TILES = [
    {
      id: "buy-sell", name: "Buy & Sell", icon: "ShoppingBag", route: "/marketplace", newHref: "/marketplace/new",
      color: "text-blue-600 dark:text-blue-400", bgColor: "bg-blue-100 dark:bg-blue-500/15",
      borderColor: "border-blue-200 dark:border-blue-800",
      count: marketplaceCount, countLabel: "items listed", isPremium: false,
    },
    {
      id: "rentals", name: "Rentals & PGs", icon: "Home", route: "/rentals", newHref: "/rentals/new",
      color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-100 dark:bg-emerald-500/15",
      borderColor: "border-emerald-200 dark:border-emerald-800",
      count: rentalCount, countLabel: "places", isPremium: false,
    },
    {
      id: "job-referrals", name: "Job Referrals", icon: "Briefcase", route: "/referrals", newHref: "/referrals/new",
      color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-100 dark:bg-violet-500/15",
      borderColor: "border-violet-200 dark:border-violet-800",
      count: referralCount, countLabel: "open roles", isPremium: false,
    },
    {
      id: "carpool", name: "Carpool", icon: "Car", route: "/carpool", newHref: "/carpool/new",
      color: "text-orange-600 dark:text-orange-400", bgColor: "bg-orange-100 dark:bg-orange-500/15",
      borderColor: "border-orange-200 dark:border-orange-800",
      count: carpoolCount, countLabel: "active routes", isPremium: false,
    },
    {
      id: "services", name: "Skill Marketplace", icon: "Wrench", route: "/skills", newHref: "/skills/new",
      color: "text-cyan-600 dark:text-cyan-400", bgColor: "bg-cyan-100 dark:bg-cyan-500/15",
      borderColor: "border-cyan-200 dark:border-cyan-800",
      count: skillCount, countLabel: "professionals", isPremium: false,
    },
    {
      id: "deals", name: "Deals", icon: "Tag", route: "/deals", newHref: "/deals/new",
      color: "text-rose-600 dark:text-rose-400", bgColor: "bg-rose-100 dark:bg-rose-500/15",
      borderColor: "border-rose-200 dark:border-rose-800",
      count: dealCount, countLabel: "active deals", isPremium: false,
    },
    {
      id: "events", name: "Events", icon: "Users", route: "/events", newHref: "/events/new",
      color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-500/15",
      borderColor: "border-amber-200 dark:border-amber-800",
      count: eventCount, countLabel: "upcoming", isPremium: false,
    },
  ]

  return (
    <div className="min-h-full bg-background">
      <DashboardRefresh />

      {/* ── Mobile compact header ───────────────────────────────── */}
      <div className="md:hidden">
        <MobileDashboardHeader
          name={session?.user?.name}
          avatarUrl={session?.user?.avatarUrl ?? session?.user?.image}
          city={userCity}
          greeting={greeting}
        />
      </div>

      {/* ── Photographic hero (desktop) ─────────────────────────── */}
      <div className="hidden md:block relative text-white overflow-hidden" style={{ minHeight: 320 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1920&q=85&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/50 via-transparent to-violet-950/40" />
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-violet-400/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">

          <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 ring-2 ring-white/30 shadow-lg shrink-0">
                <AvatarImage src={session?.user?.avatarUrl ?? session?.user?.image ?? ""} />
                <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                  {getInitials(session?.user?.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-white/60">{greeting},</p>
                <h1 className={cn("font-outfit", "text-3xl sm:text-4xl font-extrabold tracking-tight drop-shadow-lg")}>
                  <span className="bg-gradient-to-r from-white via-indigo-200 to-violet-200 bg-clip-text text-transparent">
                    {session?.user?.name?.split(" ")[0] ?? "there"}
                  </span>
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {session?.user?.isVerified && (
                    <VerifiedBadge size="sm" className="border-white/30 bg-white/10 text-white" />
                  )}
                  {userCity && (
                    <span className="flex items-center gap-1 text-white/70 text-xs">
                      <MapPin className="h-3 w-3" /> {userCity}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <PostPickerButton panelClassName="right-0">
              <Button className="shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white hover:brightness-110 font-bold shadow-[0_4px_20px_rgba(99,102,241,0.4)] backdrop-blur-sm rounded-full border-0">
                <Plus className="h-4 w-4 mr-1.5" /> Post something
              </Button>
            </PostPickerButton>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-8 flex-wrap">
            <div>
              <p className={cn("font-outfit", "text-3xl font-extrabold tabular-nums bg-gradient-to-r from-indigo-300 to-blue-200 bg-clip-text text-transparent")}>{myListingsCount}</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Active Listings</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className={cn("font-outfit", "text-3xl font-extrabold tabular-nums bg-gradient-to-r from-violet-300 to-purple-200 bg-clip-text text-transparent")}>{totalViews}</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Views</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className={cn("font-outfit", "text-3xl font-extrabold tabular-nums bg-gradient-to-r from-fuchsia-300 to-pink-200 bg-clip-text text-transparent")}>{myMessages}</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Messages</p>
            </div>
          </div>

          {/* Search */}
          <div className="mb-2">
            <DashboardSearchBar variant="glass" />
          </div>

          {/* Quick actions */}
          <div className="mt-6 flex items-center gap-5 sm:gap-7 flex-wrap">
            {QUICK_ACTIONS.map(({ label, href, icon: Icon, badge }) => {
              const content = (
                <>
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-all group-hover:bg-white/25 group-hover:scale-105">
                    <Icon className="h-4.5 w-4.5 text-white" />
                    {!!badge && badge > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-400 px-1 text-[10px] font-bold text-white ring-2 ring-indigo-900">
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </span>
                  <span className="text-sm font-medium text-white/90 group-hover:text-white">{label}</span>
                </>
              )

              if (href === null) {
                return (
                  <PostPickerButton key={label}>
                    <button type="button" className="group flex items-center gap-2.5">
                      {content}
                    </button>
                  </PostPickerButton>
                )
              }

              return (
                <Link key={label} href={href} className="group flex items-center gap-2.5">
                  {content}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Services category strip (desktop only — mobile uses the icon grid below) ── */}
      <div className="hidden md:block">
        <CategoryStrip
          activeValue="All"
          basePath="/dashboard"
          paramName="service"
          ringClass="ring-indigo-400"
          glowShadow="shadow-[0_0_12px_rgba(99,102,241,0.4)]"
          underlineGradient="from-indigo-500 to-violet-400"
          items={[
            { value: "All", label: "Home", icon: "LayoutDashboard", iconBg: "bg-slate-100 dark:bg-white/10", iconColor: "text-slate-600 dark:text-white", count: marketplaceCount + rentalCount + referralCount + carpoolCount + skillCount + dealCount + eventCount },
            ...SERVICE_TILES.map((service) => ({
              value: service.route,
              label: service.name,
              icon: service.icon,
              iconBg: service.bgColor,
              iconColor: service.color,
              count: service.count,
              image: SERVICE_IMAGE_MAP[service.id],
            })),
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Wishlist / My Interests (mobile) — desktop gets these in the hero's
            quick-actions row; mobile has no equivalent spot, so give them
            their own compact row here. */}
        <div className="md:hidden -mt-2 flex items-center gap-3">
          <Link
            href="/wishlist"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-card border border-border py-3 text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform"
          >
            <Heart className="h-4 w-4 text-rose-500" /> Wishlist
          </Link>
          <Link
            href="/my-interests"
            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-card border border-border py-3 text-sm font-semibold shadow-sm active:scale-[0.98] transition-transform"
          >
            <ThumbsUp className="h-4 w-4 text-primary-600" /> My Interests
          </Link>
        </div>

        {/* Service icon grid (mobile) — same real images as the desktop strip */}
        <div className="md:hidden -mt-2">
          <ServiceIconGrid
            tiles={SERVICE_TILES.map((s) => ({
              id: s.id, name: s.name, icon: s.icon, route: s.route,
              color: s.color, bgColor: s.bgColor, count: s.count, countLabel: s.countLabel,
              image: SERVICE_IMAGE_MAP[s.id],
            }))}
          />
        </div>

        {/* Services hero cards (desktop) */}
        <div className="hidden md:block">
          <h2 className="text-base font-semibold mb-4">
            Top Services{userCity && <span className="text-muted-foreground font-normal text-sm ml-2">in {userCity}</span>}
          </h2>
          <ServiceHeroCards
            cards={[
              {
                id: "buy-sell",
                title: "Buy & Sell",
                subtitle: "From your colleagues",
                count: marketplaceCount,
                countLabel: "live",
                href: "/marketplace",
                icon: "ShoppingBag",
                image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80",
                from: "from-blue-500",
                to: "to-blue-600",
              },
              {
                id: "rentals",
                title: "Rentals & PGs",
                subtitle: "Find a place nearby",
                count: rentalCount,
                countLabel: "places",
                href: "/rentals",
                icon: "Home",
                image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
                from: "from-emerald-500",
                to: "to-emerald-600",
              },
              {
                id: "job-referrals",
                title: "Job Referrals",
                subtitle: "Get referred, get hired",
                count: referralCount,
                countLabel: "open",
                href: "/referrals",
                icon: "Briefcase",
                image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&q=80",
                from: "from-violet-500",
                to: "to-violet-600",
              },
            ]}
          />
        </div>

        {/* Recent listings */}
        <div>
          {recentListings.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold">Recent in {userCity ?? "your area"}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Latest across all services from your colleagues</p>
                </div>
                <Link href="/dashboard" className="flex items-center gap-1 text-sm text-accent-400 hover:underline">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentListings.map((item) => (
                  <ListingCard
                    key={item.id}
                    id={item.id}
                    href={item.href}
                    title={item.title}
                    subtitle={item.subtitle}
                    price={item.price}
                    priceLabel={item.priceLabel}
                    images={item.images}
                    author={item.author}
                    badge={item.badge}
                    city={item.city}
                    createdAt={item.createdAt}
                    listingId={item.id}
                    wishlistItemType={item.wishlistItemType}
                    isWishlisted={wishlistedKeys.has(`${item.wishlistItemType}:${item.id}`)}
                    serviceBorderColor="border-l-blue-400"
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 rounded-3xl bg-card shadow-md">
              <p className="text-muted-foreground text-sm">Nothing posted in {userCity ?? "your area"} yet.</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/marketplace/new"><Plus className="h-4 w-4" /> Be the first to post</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Report a concern */}
        <Link
          href="/report"
          className="flex items-center justify-between gap-3 rounded-3xl bg-card shadow-md p-5 hover:shadow-lg transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <Flag className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Report a concern</p>
              <p className="text-xs text-muted-foreground">Flag a bug or issue.</p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
        </Link>
      </div>
    </div>
  )
}
