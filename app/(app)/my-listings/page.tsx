import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import { Plus, Eye, Pencil, ExternalLink, Package, TrendingUp, BadgeCheck, Wallet, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"
import { LISTING_CATEGORIES } from "@/config/services"

interface PageProps { searchParams: { tab?: string } }

const TABS = [
  { key: "all",     label: "All"     },
  { key: "active",  label: "Active"  },
  { key: "sold",    label: "Sold"    },
  { key: "expired", label: "Expired" },
]

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  SOLD:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  EXPIRED: "bg-muted text-muted-foreground",
}

export const metadata = { title: "My Listings" }

export default async function MyListingsPage({ searchParams }: PageProps) {
  const session = await auth()
  const userId  = session!.user!.id
  const tab     = TABS.find(t => t.key === searchParams.tab)?.key ?? "all"

  const statusFilter = tab === "all" ? undefined : tab.toUpperCase()

  const [listings, grouped] = await Promise.all([
    prisma.listing.findMany({
      where:   { userId, ...(statusFilter ? { status: statusFilter } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        offers: {
          where:   { status: "ACCEPTED" },
          select:  { amount: true, buyer: { select: { name: true, jobTitle: true, company: { select: { name: true } } } } },
          take: 1,
        },
      },
    }),
    prisma.listing.groupBy({
      by:    ["status"],
      where: { userId },
      _count: { id: true },
      _sum:   { viewCount: true },
    }),
  ])

  const count = (s: string) => grouped.find(g => g.status === s)?._count.id ?? 0
  const activeCount  = count("ACTIVE")
  const soldCount    = count("SOLD")
  const expiredCount = count("EXPIRED")
  const totalViews   = grouped.reduce((s, g) => s + (g._sum.viewCount ?? 0), 0)
  const totalEarned  = listings
    .filter(l => l.status === "SOLD" && l.offers.length > 0)
    .reduce((s, l) => s + l.offers[0].amount, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Listings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">All items you&apos;ve posted for sale</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/my-rentals"><Home className="h-4 w-4" /> My Rentals</Link>
          </Button>
          <Button asChild>
            <Link href="/marketplace/new"><Plus className="h-4 w-4" /> Post Item</Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { icon: TrendingUp,  label: "Active",      value: activeCount,  color: "text-green-600 dark:text-green-400",  bg: "bg-green-100 dark:bg-green-500/15"  },
          { icon: BadgeCheck,  label: "Sold",        value: soldCount,    color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-500/15"    },
          { icon: Eye,         label: "Total Views", value: totalViews,   color: "text-violet-600 dark:text-violet-400",bg: "bg-violet-100 dark:bg-violet-500/15"},
          { icon: Wallet,      label: "Earned",      value: totalEarned,  color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-500/15", isCurrency: true },
        ].map(({ icon: Icon, label, value, color, bg, isCurrency }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xl font-bold">{isCurrency ? formatCurrency(value as number) : value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const cnt = t.key === "all" ? activeCount + soldCount + expiredCount
            : t.key === "active" ? activeCount : t.key === "sold" ? soldCount : expiredCount
          return (
            <Link
              key={t.key}
              href={`/my-listings?tab=${t.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === t.key
                  ? "bg-background shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
              {cnt > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground"
                }`}>
                  {cnt}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">
            {tab === "all" ? "You haven't posted anything yet." :
             tab === "sold" ? "No sold listings yet." :
             tab === "expired" ? "No expired listings." :
             "No active listings."}
          </p>
          {tab !== "sold" && (
            <Button asChild size="sm" className="mt-4">
              <Link href="/marketplace/new"><Plus className="h-4 w-4" /> Post your first item</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const catMeta     = LISTING_CATEGORIES.find(c => c.value === listing.category)
            const acceptedOffer = listing.offers[0] ?? null
            const isSold      = listing.status === "SOLD"
            const isActive    = listing.status === "ACTIVE"

            return (
              <div
                key={listing.id}
                className="group bg-card border border-border rounded-2xl p-4 flex gap-4 hover:border-border/60 hover:shadow-sm transition-all"
              >
                {/* Thumbnail */}
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                  {listing.images[0] ? (
                    <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    </div>
                  )}
                  {isSold && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-[9px] font-extrabold text-white uppercase tracking-widest">Sold</span>
                    </div>
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">{listing.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {catMeta?.label ?? listing.category} · {listing.city}
                        <span className="mx-1.5 opacity-40">·</span>
                        {formatRelativeTime(listing.createdAt)}
                      </p>
                    </div>

                    {/* Status badge */}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[listing.status] ?? STATUS_BADGE.EXPIRED}`}>
                      {listing.status}
                    </span>
                  </div>

                  {/* Price row */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div>
                      <span className="font-bold text-sm">{formatCurrency(listing.price)}</span>
                      {isSold && acceptedOffer && acceptedOffer.amount !== listing.price && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                          sold for {formatCurrency(acceptedOffer.amount)}
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" /> {listing.viewCount}
                    </span>
                    {isSold && acceptedOffer?.buyer && (
                      <span className="text-xs text-muted-foreground">
                        buyer: {acceptedOffer.buyer.name ?? "—"}
                        {acceptedOffer.buyer.jobTitle && ` · ${acceptedOffer.buyer.jobTitle}`}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                      <Link href={`/marketplace/${listing.id}`}>
                        <ExternalLink className="h-3 w-3" /> View
                      </Link>
                    </Button>
                    {isActive && (
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                        <Link href={`/marketplace/${listing.id}/edit`}>
                          <Pencil className="h-3 w-3" /> Edit
                        </Link>
                      </Button>
                    )}
                    {isActive && (
                      <form action={`/api/listings/${listing.id}/close`} method="POST">
                        <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground" type="submit">
                          Mark Sold
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
