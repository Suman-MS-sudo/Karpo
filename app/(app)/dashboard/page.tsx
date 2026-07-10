export const dynamic = "force-dynamic"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Plus, TrendingUp, Eye, MessageSquare, MapPin, Crown, Zap, ArrowRight,
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Shield, Gift,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ListingCard } from "@/components/shared/ListingCard"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { getInitials } from "@/lib/utils"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ShoppingBag, Home, Briefcase, Car, Wrench, Tag, Users, GraduationCap, Shield, Gift,
}

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
    prisma.servicePost.count({ where: { isActive: true, ...cityFilter } }),
    prisma.event.count({ where: { isActive: true, date: { gte: new Date() }, ...(userCity ? { location: userCity } : {}) } }),
  ])

  const totalViews = viewsAgg._sum.viewCount ?? 0

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
      id: "services", name: "Skill Marketplace", icon: "Wrench", route: "/services", newHref: "/services/new",
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* ── Welcome card ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-accent-500 p-6 text-white">
        <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 -left-6 h-28 w-28 bg-white/5 rounded-full" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-white/30 shrink-0">
              <AvatarImage src={session?.user?.avatarUrl ?? session?.user?.image ?? ""} />
              <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                {getInitials(session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold leading-tight text-red-500">
                Good day, {session?.user?.name?.split(" ")[0] ?? "there"}!
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
          <Button asChild size="sm" className="shrink-0 bg-white text-primary-700 hover:bg-white/90 font-semibold">
            <Link href="/marketplace/new">
              <Plus className="h-4 w-4" /> Post
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────────────────── */}
      <div>
      <h2 className="text-base font-semibold mb-4">My Dashboard</h2>
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Active Listings", value: myListingsCount, icon: TrendingUp,   href: "/my-postings", color: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-100 dark:bg-blue-500/15"      },
          { label: "Listing Views",   value: totalViews,      icon: Eye,           href: "/my-postings", color: "text-purple-600 dark:text-purple-400",  bg: "bg-purple-100 dark:bg-purple-500/15"  },
          { label: "Unread Messages", value: myMessages,      icon: MessageSquare, href: "/messages",    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
        ].map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href} className="group">
            <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md transition-all">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold leading-none ${value === 0 ? "text-muted-foreground" : "text-foreground"}`}>
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </div>
          </Link>
        ))}
      </div>
      </div>

      {/* ── Premium upsell — free users only ──────────────────────── */}
      {!isPremium && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5">
          <div className="absolute -top-4 -right-4 h-24 w-24 bg-amber-200/30 dark:bg-amber-700/20 rounded-full" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Go Premium — Unlimited Everything</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug max-w-sm">
                Free plan: 3 listings · 2 carpool routes · 5 deal redemptions/month · 2 concierge requests.
                Premium removes all limits + unlocks boosts, priority matching &amp; more.
              </p>
            </div>
            <Link
              href="/membership"
              className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              <Zap className="h-3.5 w-3.5" /> ₹99/mo
            </Link>
          </div>
        </div>
      )}

      {/* ── Services hub ──────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-semibold mb-4">
          Services{userCity && <span className="text-muted-foreground font-normal text-sm ml-2">in {userCity}</span>}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SERVICE_TILES.map((service) => {
            const Icon = iconMap[service.icon] ?? ShoppingBag
            return (
              <div key={service.id} className="relative group">
                <Link href={service.route} className="block">
                  <div className="bg-card border border-border rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-foreground/20">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${service.bgColor}`}>
                      <Icon className={`h-5 w-5 ${service.color}`} />
                    </div>
                    <p className="text-sm font-semibold leading-tight mb-1">{service.name}</p>
                    {service.count !== null ? (
                      <p className={`text-xs font-medium ${service.color}`}>
                        {service.count.toLocaleString()} {service.countLabel}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">{service.countLabel}</p>
                    )}
                    {service.newHref && <div className="mt-5" />}
                  </div>
                </Link>
                {service.newHref && (
                  <Link
                    href={service.newHref}
                    className={`absolute bottom-3.5 left-4 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all opacity-0 group-hover:opacity-100 ${service.bgColor} ${service.color}`}
                  >
                    <Plus className="h-3 w-3" /> Post
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Recent listings ───────────────────────────────────────── */}
      {recentListings.length > 0 && (
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
      )}

      {recentListings.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground text-sm">No listings in {userCity ?? "your area"} yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/marketplace/new"><Plus className="h-4 w-4" /> Be the first to post</Link>
          </Button>
        </div>
      )}
    </div>
  )
}
