export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Plus, MessageSquare, MapPin, Crown, Zap, ArrowRight, Flag,
  Bell, FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ListingCard } from "@/components/shared/ListingCard"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { getInitials, cn } from "@/lib/utils"
import { ServiceHeroCards } from "@/components/dashboard/ServiceHeroCards"
import { CategoryStrip } from "@/components/shared/CategoryStrip"
import { DashboardSearchBar } from "@/components/dashboard/DashboardSearchBar"
import { ActivityChart } from "@/components/dashboard/ActivityChart"
import { MobileDashboardHeader } from "@/components/dashboard/MobileDashboardHeader"
import { ServiceIconGrid } from "@/components/dashboard/ServiceIconGrid"


export default async function DashboardPage() {
  const session  = await auth()
  const userId   = session!.user!.id
  const userCity = session!.user!.city
  const isPremium = session!.user!.membershipPlan === "PREMIUM"

  const cityFilter = userCity ? { city: userCity } : {}

  const [
    recentListings,
    myListingsCount,
    myMessages,
    viewsAgg,
    marketplaceCount,
    rentalCount,
    referralCount,
    carpoolCount,
    skillCount,
    eventCount,
  ] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", ...cityFilter },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
    }),
    prisma.listing.count({ where: { userId, status: "ACTIVE" } }),
    prisma.message.count({ where: { receiverId: userId, isRead: false } }),
    prisma.listing.aggregate({ where: { userId }, _sum: { viewCount: true } }),
    prisma.listing.count({ where: { status: "ACTIVE", ...cityFilter } }),
    prisma.rentalPost.count({ where: { status: "ACTIVE", ...cityFilter } }),
    prisma.jobReferral.count({ where: { status: "OPEN", ...(userCity ? { location: userCity } : {}) } }),
    prisma.carpoolRoute.count({ where: { isActive: true, ...(userCity ? { fromLocation: userCity } : {}) } }),
    prisma.skillListing.count({ where: { status: "ACTIVE", ...(userCity ? { location: userCity } : {}) } }),
    prisma.event.count({ where: { isActive: true, date: { gte: new Date() }, ...(userCity ? { location: userCity } : {}) } }),
  ])

  const totalViews = viewsAgg._sum.viewCount ?? 0

  const hour = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false })
  const greeting = Number(hour) < 12 ? "Good morning" : Number(hour) < 17 ? "Good afternoon" : "Good evening"

  const QUICK_ACTIONS = [
    { label: "Post listing", href: "/marketplace/new", icon: Plus },
    { label: "Messages", href: "/messages", icon: MessageSquare, badge: myMessages },
    { label: "My postings", href: "/my-postings", icon: FileText },
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
      id: "events", name: "Events", icon: "Users", route: "/events", newHref: "/events/new",
      color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-100 dark:bg-amber-500/15",
      borderColor: "border-amber-200 dark:border-amber-800",
      count: eventCount, countLabel: "upcoming", isPremium: false,
    },
  ]

  return (
    <div className="min-h-full bg-background">

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
            <Button asChild className="shrink-0 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 text-white hover:brightness-110 font-bold shadow-[0_4px_20px_rgba(99,102,241,0.4)] backdrop-blur-sm rounded-full border-0">
              <Link href="/marketplace/new">
                <Plus className="h-4 w-4 mr-1.5" /> Post something
              </Link>
            </Button>
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
            {QUICK_ACTIONS.map(({ label, href, icon: Icon, badge }) => (
              <Link key={label} href={href} className="group flex items-center gap-2.5">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-all group-hover:bg-white/25 group-hover:scale-105">
                  <Icon className="h-4.5 w-4.5 text-white" />
                  {!!badge && badge > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-400 px-1 text-[10px] font-bold text-white ring-2 ring-indigo-900">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </span>
                <span className="text-sm font-medium text-white/90 group-hover:text-white">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Services category strip ─────────────────────────────── */}
      <CategoryStrip
        activeValue="All"
        basePath="/dashboard"
        paramName="service"
        ringClass="ring-indigo-400"
        glowShadow="shadow-[0_0_12px_rgba(99,102,241,0.4)]"
        underlineGradient="from-indigo-500 to-violet-400"
        items={[
          { value: "All", label: "Home", icon: "LayoutDashboard", iconBg: "bg-slate-100 dark:bg-white/10", iconColor: "text-slate-600 dark:text-white", count: marketplaceCount + rentalCount + referralCount + carpoolCount + skillCount + eventCount },
          ...SERVICE_TILES.map((service) => ({
            value: service.route,
            label: service.name,
            icon: service.icon,
            iconBg: service.bgColor,
            iconColor: service.color,
            count: service.count,
          })),
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Service icon grid (mobile) */}
        <div className="md:hidden -mt-2">
          <ServiceIconGrid
            tiles={SERVICE_TILES.map((s) => ({
              id: s.id, name: s.name, icon: s.icon, route: s.route,
              color: s.color, bgColor: s.bgColor, count: s.count, countLabel: s.countLabel,
            }))}
          />
        </div>

        {/* Activity chart */}
        <div className="rounded-3xl bg-card shadow-md p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-semibold">Activity{userCity && ` in ${userCity}`}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Live listings by category</p>
            </div>
          </div>
          <ActivityChart
            stats={[
              { label: "Buy & Sell", value: marketplaceCount, href: "/marketplace", icon: "ShoppingBag", iconBg: "bg-blue-100 dark:bg-blue-500/15", iconColor: "text-blue-600 dark:text-blue-400" },
              { label: "Rentals", value: rentalCount, href: "/rentals", icon: "Home", iconBg: "bg-emerald-100 dark:bg-emerald-500/15", iconColor: "text-emerald-600 dark:text-emerald-400" },
              { label: "Referrals", value: referralCount, href: "/referrals", icon: "Briefcase", iconBg: "bg-violet-100 dark:bg-violet-500/15", iconColor: "text-violet-600 dark:text-violet-400" },
              { label: "Carpool", value: carpoolCount, href: "/carpool", icon: "Car", iconBg: "bg-orange-100 dark:bg-orange-500/15", iconColor: "text-orange-600 dark:text-orange-400" },
              { label: "Skills", value: skillCount, href: "/skills", icon: "Wrench", iconBg: "bg-cyan-100 dark:bg-cyan-500/15", iconColor: "text-cyan-600 dark:text-cyan-400" },
              { label: "Events", value: eventCount, href: "/events", icon: "Users", iconBg: "bg-amber-100 dark:bg-amber-500/15", iconColor: "text-amber-600 dark:text-amber-400" },
            ]}
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

        {/* Premium + report */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {!isPremium && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-amber-950 dark:to-zinc-900 p-5 text-white">
              <div className="pointer-events-none absolute -top-4 -right-4 h-24 w-24 bg-amber-500/20 rounded-full blur-lg" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <span className="font-semibold text-sm">Go Premium</span>
                  </div>
                  <p className="text-xs text-white/60 leading-snug max-w-xs">
                    Unlimited listings, carpool routes &amp; deal redemptions. Priority matching + boosts.
                  </p>
                </div>
                <Link
                  href="/membership"
                  className="shrink-0 flex items-center gap-1.5 text-xs font-bold bg-amber-400 text-zinc-900 hover:bg-amber-300 px-3 py-2.5 rounded-xl transition-colors whitespace-nowrap"
                >
                  <Zap className="h-3.5 w-3.5" /> ₹99/mo
                </Link>
              </div>
            </div>
          )}

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

        {/* Recent listings */}
        <div>
          {recentListings.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold">Recent in {userCity ?? "your area"}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Latest from your colleagues</p>
                </div>
                <Link href="/marketplace" className="flex items-center gap-1 text-sm text-accent-400 hover:underline">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentListings.map((listing) => (
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
                    serviceBorderColor="border-l-blue-400"
                    isOwn={listing.userId === userId}
                    listingId={listing.id}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 rounded-3xl bg-card shadow-md">
              <p className="text-muted-foreground text-sm">No listings in {userCity ?? "your area"} yet.</p>
              <Button asChild size="sm" className="mt-4">
                <Link href="/marketplace/new"><Plus className="h-4 w-4" /> Be the first to post</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
