import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { FileWarning, ExternalLink, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminReportsPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin")
  if (session.user?.role !== "ADMIN") redirect("/dashboard")

  const reports = await prisma.listingReport.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      listing: { select: { id: true, title: true, status: true } },
      user:    { select: { name: true, email: true } },
    },
  })

  const pending  = reports.filter((r) => r.status === "PENDING")
  const resolved = reports.filter((r) => r.status !== "PENDING")

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><FileWarning className="h-5 w-5" /> Reports</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{pending.length} pending · {resolved.length} resolved</p>
      </div>

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
              <div key={report.id} className="px-5 py-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-medium text-sm">{report.listing.title}</p>
                    <Badge variant="secondary" className="text-[10px]">{report.reason}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Reported by {report.user.name ?? report.user.email} · {formatRelativeTime(report.createdAt)}
                  </p>
                  {report.details && <p className="text-xs text-muted-foreground mt-1 italic">{report.details}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link href={`/marketplace/${report.listingId}`} target="_blank">
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                      <ExternalLink className="h-3 w-3" />View
                    </Button>
                  </Link>
                  <form action={`/api/admin/reports/${report.id}/dismiss`} method="POST">
                    <Button size="sm" variant="outline" className="h-7 text-xs">Dismiss</Button>
                  </form>
                  <form action={`/api/admin/reports/${report.id}/remove`} method="POST">
                    <Button size="sm" variant="destructive" className="h-7 text-xs">Remove Listing</Button>
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
              <div key={report.id} className="px-5 py-3 flex items-center justify-between gap-3 opacity-60">
                <div>
                  <p className="text-sm">{report.listing.title}</p>
                  <p className="text-xs text-muted-foreground">{report.reason} · {report.status}</p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
