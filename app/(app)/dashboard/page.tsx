import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, TrendingUp, Eye, MessageSquare, MapPin, Crown, Zap, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ServiceToggleGrid } from "@/components/shared/ServiceToggleGrid"
import { ListingCard } from "@/components/shared/ListingCard"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { getInitials } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await auth()
  const userId = session!.user!.id
  const userCity = session!.user!.city
  const isPremium = session!.user!.membershipPlan === "PREMIUM"

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbUser = await (prisma.user.findUnique as any)({ where: { id: userId }, select: { hiddenServices: true } }).catch(() => null)
  const hiddenServices: string[] = dbUser?.hiddenServices ?? []

  const [recentListings, myListingsCount, myMessages, viewsAgg] = await Promise.all([
    prisma.listing.findMany({
      where: { status: "ACTIVE", ...(userCity ? { city: userCity } : {}) },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        user: {
          include: { company: { select: { name: true, logo: true, domain: true } } },
        },
      },
    }),
    prisma.listing.count({ where: { userId, status: "ACTIVE" } }),
    prisma.message.count({ where: { receiverId: userId, isRead: false } }),
    prisma.listing.aggregate({ where: { userId }, _sum: { viewCount: true } }),
  ])

  const totalViews = viewsAgg._sum.viewCount ?? 0

  const stats = [
    { label: "Active Listings", value: myListingsCount, icon: TrendingUp,   href: "/my-postings",            color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-500/15"    },
    { label: "Listing Views",   value: totalViews,      icon: Eye,           href: "/my-postings",            color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-500/15" },
    { label: "Unread Messages", value: myMessages,      icon: MessageSquare, href: "/messages",               color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-100 dark:bg-emerald-500/15" },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">

      {/* ── Welcome card ────────────────────────────────────────────────── */}
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
              <h1 className="text-xl font-bold leading-tight">
                Good day, {session?.user?.name?.split(" ")[0] ?? "there"}!
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {session?.user?.company && (
                  <span className="text-white/80 text-sm">{session.user.company.name}</span>
                )}
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
          <Button
            asChild
            size="sm"
            className="shrink-0 bg-white text-primary-700 hover:bg-white/90 font-semibold"
          >
            <Link href="/marketplace/new">
              <Plus className="h-4 w-4" /> Post
            </Link>
          </Button>
        </div>
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href} className="group">
            <div className="bg-card border border-border rounded-2xl p-4 hover:shadow-md hover:border-border/60 transition-all">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-3 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <p className={`text-2xl font-bold leading-none ${value === 0 ? "text-muted-foreground" : "text-foreground"}`}>
                {value}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-tight">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Premium upsell — free users only ─────────────────────────────── */}
      {!isPremium && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5">
          <div className="absolute -top-4 -right-4 h-24 w-24 bg-amber-200/30 dark:bg-amber-700/20 rounded-full" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Unlock Premium</span>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug max-w-xs">
                Get Deals Hub, Learning, Concierge, unlimited listings & 10 photos per post.
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

      {/* ── Services grid ─────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-foreground">Services</h2>
          {!isPremium && (
            <Link href="/membership">
              <Badge variant="premium" className="cursor-pointer text-[10px]">Premium unlocks more →</Badge>
            </Link>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">Toggle services on or off to customise your dashboard.</p>
        <ServiceToggleGrid isPremium={isPremium} initialHidden={hiddenServices} />
      </div>

      {/* ── Recent listings ───────────────────────────────────────────────── */}
      {recentListings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Recent in {userCity ?? "your area"}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Latest from your colleagues</p>
            </div>
            <Link
              href="/marketplace"
              className="flex items-center gap-1 text-sm text-accent-400 hover:underline"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
