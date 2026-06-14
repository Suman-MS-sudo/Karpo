import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Car, ExternalLink, Users, Clock, ArrowRight, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

export const metadata = { title: "My Carpool Routes" }
export const dynamic  = "force-dynamic"

const TABS = [
  { key: "all",      label: "All"      },
  { key: "active",   label: "Active"   },
  { key: "inactive", label: "Inactive" },
]

interface PageProps { searchParams: { tab?: string } }

export default async function MyCarpoolPage({ searchParams }: PageProps) {
  const session = await auth()
  const userId  = session!.user!.id
  const tab     = TABS.find((t) => t.key === searchParams.tab)?.key ?? "all"

  const isActiveFilter = tab === "all" ? undefined : tab === "active"

  const routes = await prisma.carpoolRoute.findMany({
    where:   { userId, ...(isActiveFilter !== undefined ? { isActive: isActiveFilter } : {}) },
    orderBy: { createdAt: "desc" },
    include: {
      _count:   { select: { requests: true } },
      requests: {
        where:  { status: "PENDING" },
        select: { id: true },
      },
    },
  })

  const activeCount   = routes.filter(r => r.isActive).length
  const inactiveCount = routes.filter(r => !r.isActive).length
  const pendingCount  = routes.reduce((s, r) => s + r.requests.length, 0)
  const totalCount    = routes.length

  const FREQ_LABELS: Record<string, string> = {
    WEEKDAYS: "Mon–Fri",
    DAILY:    "Daily",
    WEEKENDS: "Weekends",
    ONCE:     "One-time",
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Carpool Routes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Routes you've offered for colleagues</p>
        </div>
        <Button asChild>
          <Link href="/carpool/new"><Plus className="h-4 w-4" /> Offer a Ride</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Total Routes",    value: totalCount    },
          { label: "Active",          value: activeCount   },
          { label: "Inactive",        value: inactiveCount },
          { label: "Pending Requests",value: pendingCount  },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const cnt = t.key === "all" ? totalCount : t.key === "active" ? activeCount : inactiveCount
          return (
            <Link
              key={t.key}
              href={`/my-carpool?tab=${t.key}`}
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
                }`}>{cnt}</span>
              )}
            </Link>
          )
        })}
      </div>

      {/* List */}
      {routes.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Car className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No routes yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/carpool/new"><Plus className="h-4 w-4" /> Offer your first route</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {routes.map((route) => {
            const pendingReqs = route.requests.length
            return (
              <div key={route.id}
                className="group bg-card border border-border rounded-2xl p-4 hover:border-border/60 hover:shadow-sm transition-all">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 flex items-center justify-center shrink-0">
                    <Car className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 font-semibold text-sm">
                        <span className="truncate max-w-[140px]">{route.fromLocation}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate max-w-[140px]">{route.toLocation}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        route.isActive
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {route.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{route.departureTime}
                      </span>
                      <span>{FREQ_LABELS[route.frequency] ?? route.frequency}</span>
                      <span>{route.seatsAvailable} seat{route.seatsAvailable !== 1 ? "s" : ""}</span>
                      <span className="font-medium text-foreground">{formatCurrency(route.pricePerSeat)}/seat</span>
                      <span>{route.vehicleType}</span>
                      {route.acAvailable && <span>AC</span>}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {route._count.requests} request{route._count.requests !== 1 ? "s" : ""}
                        {pendingReqs > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            ({pendingReqs} pending)
                          </span>
                        )}
                      </span>
                      <span>{formatRelativeTime(route.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                        <Link href={`/carpool/${route.id}`}><ExternalLink className="h-3 w-3" /> View</Link>
                      </Button>
                      {pendingReqs > 0 && (
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5 text-amber-600 border-amber-200" asChild>
                          <Link href={`/carpool/${route.id}#requests`}>
                            <Users className="h-3 w-3" /> {pendingReqs} Pending
                          </Link>
                        </Button>
                      )}
                    </div>
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
