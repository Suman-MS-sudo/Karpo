import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FileWarning, ExternalLink, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/utils"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"
import { CONTENT_TYPES, isReportableType } from "@/lib/content-moderation"

export const dynamic = "force-dynamic"

// Marketplace listings (ListingReport) and every other section (ContentReport)
// are shown together, each with its own View / Dismiss / Remove actions.
interface Row {
  key: string
  section: string
  title: string
  reason: string
  details: string | null
  reporter: string
  createdAt: Date
  status: string
  viewHref: string
  dismissAction: string
  removeAction: string
}

export default async function AdminReportsPage() {
  const [listingReports, contentReports] = await Promise.all([
    prisma.listingReport.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        listing: { select: { id: true, title: true, status: true } },
        user:    { select: { name: true, email: true } },
      },
    }),
    prisma.contentReport.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  // Resolve titles for content reports (one lookup per report; volumes are small).
  const contentTitles = await Promise.all(
    contentReports.map(async (r) => (isReportableType(r.itemType) ? (await CONTENT_TYPES[r.itemType].load(r.itemId))?.title : undefined))
  )

  const rows: Row[] = [
    ...listingReports.map((r): Row => ({
      key: `L-${r.id}`,
      section: "Buy & Sell",
      title: r.listing.title,
      reason: r.reason,
      details: r.details,
      reporter: r.user.name ?? r.user.email ?? "A user",
      createdAt: r.createdAt,
      status: r.status,
      viewHref: `/marketplace/${r.listingId}`,
      dismissAction: `/api/admin/reports/${r.id}/dismiss`,
      removeAction: `/api/admin/reports/${r.id}/remove`,
    })),
    ...contentReports.map((r, i): Row => {
      const cfg = isReportableType(r.itemType) ? CONTENT_TYPES[r.itemType] : null
      return {
        key: `C-${r.id}`,
        section: cfg?.label ?? r.itemType,
        title: contentTitles[i] ?? "(post no longer exists)",
        reason: r.reason,
        details: r.details,
        reporter: r.user.name ?? r.user.email ?? "A user",
        createdAt: r.createdAt,
        status: r.status,
        viewHref: cfg ? cfg.path(r.itemId) : "#",
        dismissAction: `/api/admin/content-reports/${r.id}/dismiss`,
        removeAction: `/api/admin/content-reports/${r.id}/remove`,
      }
    }),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const pending  = rows.filter((r) => r.status === "PENDING")
  const resolved = rows.filter((r) => r.status !== "PENDING")

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <AdminPageHeader
        icon={FileWarning}
        title="Reports"
        subtitle={`${pending.length} pending · ${resolved.length} resolved`}
        gradient="from-rose-500 to-pink-600"
      />

      {pending.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl py-16 text-center">
          <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-3" />
          <p className="font-semibold">All clear</p>
          <p className="text-sm text-muted-foreground">No pending reports</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold">Pending ({pending.length})</h2>
          </div>
          <div className="divide-y divide-border">
            {pending.map((report) => (
              <div key={report.key} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant="outline" className="text-[10px]">{report.section}</Badge>
                    <p className="font-medium text-sm">{report.title}</p>
                    <Badge variant="secondary" className="text-[10px]">{report.reason}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reported by {report.reporter} · {formatRelativeTime(report.createdAt)}
                  </p>
                  {report.details && <p className="text-xs text-muted-foreground mt-1 italic">{report.details}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={report.viewHref} target="_blank">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <ExternalLink className="h-3 w-3" />View
                    </Button>
                  </Link>
                  <form action={report.dismissAction} method="POST">
                    <Button size="sm" variant="outline" className="h-7 text-xs">Dismiss</Button>
                  </form>
                  <form action={report.removeAction} method="POST">
                    <Button size="sm" variant="destructive" className="h-7 text-xs">Remove</Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <details className="bg-card border border-border rounded-2xl">
          <summary className="px-5 py-4 cursor-pointer font-semibold text-sm">
            Resolved ({resolved.length})
          </summary>
          <div className="divide-y divide-border">
            {resolved.map((report) => (
              <div key={report.key} className="px-5 py-3 flex items-center justify-between gap-3 opacity-60">
                <div>
                  <p className="text-sm">{report.title}</p>
                  <p className="text-xs text-muted-foreground">{report.section} · {report.reason} · {report.status}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
