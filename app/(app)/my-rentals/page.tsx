import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import Image from "next/image"
import {
  Plus, Home, Eye, Users, Pencil, ExternalLink,
  CheckCircle2, XCircle, Clock, TrendingUp, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

export const metadata = { title: "My Rentals" }
export const dynamic  = "force-dynamic"

const TABS = [
  { key: "all",    label: "All"    },
  { key: "active", label: "Active" },
  { key: "filled", label: "Filled" },
]

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:  "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  FILLED:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  EXPIRED: "bg-muted text-muted-foreground",
}

interface PageProps { searchParams: { tab?: string } }

export default async function MyRentalsPage({ searchParams }: PageProps) {
  const session = await auth()
  const userId  = session!.user!.id
  const tab     = TABS.find((t) => t.key === searchParams.tab)?.key ?? "all"
  const statusFilter = tab === "all" ? undefined : tab.toUpperCase()

  const [rentals, stats] = await Promise.all([
    prisma.rentalPost.findMany({
      where:   { userId, ...(statusFilter ? { status: statusFilter } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { inquiries: true } },
        inquiries: {
          where: { status: "ACCEPTED" },
          include: { user: { select: { name: true, company: { select: { name: true } } } } },
          take: 1,
        },
      },
    }),
    prisma.rentalPost.groupBy({
      by:    ["status"],
      where: { userId },
      _count: { id: true },
      _sum:   { viewCount: true },
    }),
  ])

  const count      = (s: string) => stats.find((g) => g.status === s)?._count.id ?? 0
  const totalViews = stats.reduce((s, g) => s + (g._sum.viewCount ?? 0), 0)
  const activeCount = count("ACTIVE")
  const filledCount = count("FILLED")

  // Pending inquiries across all rentals
  const pendingInquiries = await prisma.rentalInquiry.count({
    where: { rental: { userId }, status: "PENDING" },
  })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Rentals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">All properties you&apos;ve listed</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/my-listings"><Package className="h-4 w-4" /> My Listings</Link>
          </Button>
          <Button asChild>
            <Link href="/rentals/new"><Plus className="h-4 w-4 mr-1" />Post New</Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { icon: TrendingUp,    label: "Active",    value: activeCount,      color: "text-green-600 dark:text-green-400",  bg: "bg-green-100 dark:bg-green-500/15"  },
          { icon: CheckCircle2,  label: "Filled",    value: filledCount,      color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-100 dark:bg-blue-500/15"    },
          { icon: Eye,           label: "Views",     value: totalViews,       color: "text-violet-600 dark:text-violet-400",bg: "bg-violet-100 dark:bg-violet-500/15"},
          { icon: Users,         label: "Pending",   value: pendingInquiries, color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-100 dark:bg-amber-500/15",
            badge: pendingInquiries > 0 },
        ].map(({ icon: Icon, label, value, color, bg, badge }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center mb-2 ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label} {badge ? <span className="ml-1 text-[10px] font-bold text-amber-600 dark:text-amber-400">● new</span> : null}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const cnt = t.key === "all" ? activeCount + filledCount : t.key === "active" ? activeCount : filledCount
          return (
            <Link key={t.key} href={`/my-rentals?tab=${t.key}`}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                tab === t.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t.label}
              {cnt > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${tab === t.key ? "bg-primary-600 text-white" : "bg-muted text-muted-foreground"}`}>{cnt}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* Listings */}
      {rentals.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Home className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No {tab !== "all" ? tab : ""} rental listings yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/rentals/new"><Plus className="h-4 w-4 mr-1" />Post your first rental</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rentals.map((rental) => {
            const isFilled   = rental.status === "FILLED"
            const isActive   = rental.status === "ACTIVE"
            const acceptedInquiry = rental.inquiries[0] ?? null
            const pendingCnt = rental._count.inquiries - (isFilled ? rental.inquiries.length : 0)

            return (
              <div key={rental.id} className="group bg-card border border-border rounded-2xl p-4 flex gap-4 hover:border-border/60 hover:shadow-sm transition-all">

                {/* Thumbnail */}
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                  {rental.images[0] ? (
                    <Image src={rental.images[0]} alt={rental.title} fill className="object-cover" sizes="80px" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Home className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  {isFilled && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-[8px] font-extrabold text-white uppercase tracking-widest">Filled</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-tight truncate">{rental.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {rental.type} · {rental.area}, {rental.city}
                        <span className="mx-1.5 opacity-40">·</span>
                        {formatRelativeTime(rental.createdAt)}
                      </p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[rental.status] ?? STATUS_STYLE.EXPIRED}`}>
                      {rental.status}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <span className="font-bold text-sm">{formatCurrency(rental.rent)}<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Eye className="h-3 w-3" />{rental.viewCount}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{rental._count.inquiries} inquiries</span>
                    {pendingCnt > 0 && (
                      <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Clock className="h-3 w-3" />{pendingCnt} pending
                      </span>
                    )}
                  </div>

                  {/* Accepted tenant */}
                  {isFilled && acceptedInquiry && (
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      Filled by {acceptedInquiry.user.name ?? "—"}
                      {acceptedInquiry.user.company && ` · ${acceptedInquiry.user.company.name}`}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                      <Link href={`/rentals/${rental.id}`}><ExternalLink className="h-3 w-3" />View</Link>
                    </Button>
                    {isActive && (
                      <>
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                          <Link href={`/rentals/${rental.id}/edit`}><Pencil className="h-3 w-3" />Edit</Link>
                        </Button>
                        <form action={`/api/rentals/${rental.id}`} method="PATCH">
                          <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/rentals/${rental.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "FILLED" }) })
                              window.location.reload()
                            }}>
                            Mark Filled
                          </Button>
                        </form>
                        {rental._count.inquiries > 0 && (
                          <span className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <XCircle className="h-3 w-3" />{pendingCnt} need action
                          </span>
                        )}
                      </>
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
