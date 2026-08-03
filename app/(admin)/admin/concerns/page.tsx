import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { MessageSquareWarning, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/utils"
import { ConcernsFilterBar } from "./ConcernsFilterBar"

export const dynamic = "force-dynamic"

const CATEGORY_LABELS: Record<string, string> = {
  BUG:             "App Functionality / Error",
  FEATURE_REQUEST: "Feature Request",
  HARASSMENT:      "Harassment",
  PAYMENT:         "Payment",
  ACCOUNT:         "Account",
  OTHER:           "Other",
}

// Concerns are never auto-deleted, so history stays available well past a
// year — this filter only controls the default *view*, not retention.
const DEFAULT_RANGE_DAYS = 365

function badgeVariantFor(category: string) {
  if (category === "BUG") return "destructive" as const
  if (category === "HARASSMENT") return "destructive" as const
  return "secondary" as const
}

export default async function AdminConcernsPage({
  searchParams,
}: {
  searchParams: { category?: string; status?: string; range?: string }
}) {
  const session = await auth()

  const category = searchParams.category && searchParams.category !== "ALL" ? searchParams.category : undefined
  const status   = searchParams.status && searchParams.status !== "ALL" ? searchParams.status : undefined
  const range    = searchParams.range ?? String(DEFAULT_RANGE_DAYS)

  const createdAt =
    range === "all"
      ? undefined
      : { gte: new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000) }

  const grievances = await prisma.appGrievance.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
      ...(createdAt ? { createdAt } : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { user: { select: { name: true, email: true } } },
  })

  const open       = grievances.filter((g) => g.status === "OPEN")
  const inProgress = grievances.filter((g) => g.status === "IN_PROGRESS")
  const closed     = grievances.filter((g) => g.status === "RESOLVED" || g.status === "DISMISSED")

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <MessageSquareWarning className="h-5 w-5" /> Concerns
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {open.length} open · {inProgress.length} in progress · {closed.length} resolved/dismissed in view
        </p>
      </div>

      <ConcernsFilterBar
        category={searchParams.category ?? "ALL"}
        status={searchParams.status ?? "ALL"}
        range={range}
      />

      {open.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <p className="font-semibold">All clear</p>
          <p className="text-sm text-muted-foreground">No open concerns match this filter</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Open ({open.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {open.map((g) => (
              <ConcernRow key={g.id} g={g} />
            ))}
          </div>
        </div>
      )}

      {inProgress.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">In progress ({inProgress.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {inProgress.map((g) => (
              <ConcernRow key={g.id} g={g} />
            ))}
          </div>
        </div>
      )}

      {closed.length > 0 && (
        <details className="bg-card border border-border rounded-2xl">
          <summary className="px-5 py-4 cursor-pointer font-semibold text-sm">
            Resolved / Dismissed ({closed.length})
          </summary>
          <div className="divide-y divide-border">
            {closed.map((g) => (
              <div key={g.id} className="px-5 py-3 flex items-start justify-between gap-3 opacity-60">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={badgeVariantFor(g.category)} className="text-[10px]">
                      {CATEGORY_LABELS[g.category] ?? g.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{g.status}</span>
                  </div>
                  <p className="text-xs text-foreground/90">{g.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {g.user.name ?? g.user.email} · {formatRelativeTime(g.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}

function ConcernRow({
  g,
}: {
  g: { id: string; category: string; message: string; status: string; createdAt: Date; user: { name: string | null; email: string | null } }
}) {
  return (
    <div className="px-5 py-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge variant={badgeVariantFor(g.category)} className="text-[10px]">
            {CATEGORY_LABELS[g.category] ?? g.category}
          </Badge>
          {g.status === "IN_PROGRESS" && (
            <Badge variant="outline" className="text-[10px]">In progress</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Reported by {g.user.name ?? g.user.email} · {formatRelativeTime(g.createdAt)}
        </p>
        <p className="text-xs text-foreground/90 mt-1">{g.message}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        {g.status === "OPEN" && (
          <form action={`/api/admin/grievances/${g.id}/in-progress`} method="POST">
            <Button size="sm" variant="outline" className="h-7 text-xs">Start</Button>
          </form>
        )}
        <form action={`/api/admin/grievances/${g.id}/resolve`} method="POST">
          <Button size="sm" className="h-7 text-xs">Resolve</Button>
        </form>
        <form action={`/api/admin/grievances/${g.id}/dismiss`} method="POST">
          <Button size="sm" variant="outline" className="h-7 text-xs">Dismiss</Button>
        </form>
      </div>
    </div>
  )
}
