import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Briefcase, ExternalLink, Users, ChevronRight, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatRelativeTime } from "@/lib/utils"

export const metadata = { title: "My Referrals" }
export const dynamic  = "force-dynamic"

const TABS = [
  { key: "all",    label: "All"    },
  { key: "open",   label: "Open"   },
  { key: "filled", label: "Filled" },
  { key: "closed", label: "Closed" },
]

const STATUS_STYLE: Record<string, string> = {
  OPEN:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  FILLED: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  CLOSED: "bg-muted text-muted-foreground",
}

interface PageProps { searchParams: { tab?: string } }

export default async function MyReferralsPage({ searchParams }: PageProps) {
  const session = await auth()
  const userId  = session!.user!.id
  const tab     = TABS.find((t) => t.key === searchParams.tab)?.key ?? "all"
  const statusFilter = tab === "all" ? undefined : tab.toUpperCase()

  const [referrals, stats] = await Promise.all([
    prisma.jobReferral.findMany({
      where:   { userId, ...(statusFilter ? { status: statusFilter } : {}) },
      orderBy: { createdAt: "desc" },
      include: {
        company: { select: { name: true, logo: true } },
        _count:  { select: { applications: true } },
        applications: {
          where:  { status: "PENDING" },
          select: { id: true },
        },
      },
    }),
    prisma.jobReferral.groupBy({
      by:    ["status"],
      where: { userId },
      _count: { id: true },
    }),
  ])

  const count = (s: string) => stats.find(g => g.status === s)?._count.id ?? 0
  const openCount   = count("OPEN")
  const filledCount = count("FILLED")
  const closedCount = count("CLOSED")
  const totalCount  = openCount + filledCount + closedCount

  const totalApps = referrals.reduce((s, r) => s + r._count.applications, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Referrals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Job referrals you've posted for colleagues</p>
        </div>
        <Button asChild>
          <Link href="/referrals/new"><Plus className="h-4 w-4" /> Post Referral</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Total",       value: totalCount,  color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-100 dark:bg-violet-500/15" },
          { label: "Open",        value: openCount,   color: "text-green-600 dark:text-green-400",   bg: "bg-green-100 dark:bg-green-500/15"   },
          { label: "Filled",      value: filledCount, color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-100 dark:bg-blue-500/15"     },
          { label: "Applications",value: totalApps,   color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-100 dark:bg-amber-500/15"   },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-muted/50 p-1 rounded-xl w-fit">
        {TABS.map((t) => {
          const cnt = t.key === "all" ? totalCount
            : t.key === "open" ? openCount
            : t.key === "filled" ? filledCount : closedCount
          return (
            <Link
              key={t.key}
              href={`/my-referrals?tab=${t.key}`}
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
      {referrals.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Briefcase className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No referrals yet.</p>
          <Button asChild size="sm" className="mt-4">
            <Link href="/referrals/new"><Plus className="h-4 w-4" /> Post your first referral</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {referrals.map((r) => {
            const pendingApps = r.applications.length
            return (
              <div key={r.id}
                className="group bg-card border border-border rounded-2xl p-4 hover:border-border/60 hover:shadow-sm transition-all">
                <div className="flex gap-4">
                  {/* Icon */}
                  <div className="h-12 w-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-semibold text-sm">{r.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {r.company.name} · {r.department}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[r.status] ?? STATUS_STYLE.CLOSED}`}>
                        {r.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{r.experienceMin}–{r.experienceMax} yrs</span>
                      {r.location && <span>{r.location}</span>}
                      {r.workMode && <span className="capitalize">{r.workMode.toLowerCase()}</span>}
                      {r.referralBonus && (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          +{formatCurrency(r.referralBonus)} bonus
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {r._count.applications} application{r._count.applications !== 1 ? "s" : ""}
                        {pendingApps > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">
                            ({pendingApps} pending)
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />{formatRelativeTime(r.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                        <Link href={`/referrals/${r.id}`}><ExternalLink className="h-3 w-3" /> View</Link>
                      </Button>
                      {r._count.applications > 0 && (
                        <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs gap-1.5" asChild>
                          <Link href={`/referrals/${r.id}#applications`}>
                            <Users className="h-3 w-3" />
                            {r._count.applications} Application{r._count.applications !== 1 ? "s" : ""}
                          </Link>
                        </Button>
                      )}
                      {r.deadline && (
                        <span className="text-xs text-muted-foreground">
                          Deadline: {new Date(r.deadline).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
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
