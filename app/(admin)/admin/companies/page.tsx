import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, Clock, CheckCircle, XCircle } from "lucide-react"
import { formatDate, formatRelativeTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminCompaniesPage() {
  const session = await auth()

  const [pendingRequests, companies] = await Promise.all([
    prisma.companyRequest.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true } } },
    }),
  ])

  const pending  = pendingRequests.filter((r) => r.status === "PENDING")
  const rejected = pendingRequests.filter((r) => r.status === "REJECTED")

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Building2 className="h-5 w-5" /> Companies</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {companies.length} approved · {pending.length} pending · {rejected.length} rejected
        </p>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <div className="bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Clock className="h-4 w-4" /> Pending Approval ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900">
                <div className="min-w-0">
                  <p className="font-semibold">{req.name}</p>
                  <p className="text-sm text-muted-foreground">
                    @{req.domain}
                    {req.city && ` · ${req.city}`}
                    {` · Requested by ${req.requestedBy}`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(req.createdAt)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <form action={`/api/admin/companies/${req.id}/approve`} method="POST">
                    <Button size="sm" type="submit" className="gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5" /> Approve
                    </Button>
                  </form>
                  <form action={`/api/admin/companies/${req.id}/reject`} method="POST">
                    <Button size="sm" variant="outline" type="submit" className="gap-1.5">
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved companies */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Approved Companies
          </h2>
          <span className="text-sm text-muted-foreground">{companies.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Domain</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden sm:table-cell">City</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Members</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-muted-foreground">No companies yet</td></tr>
              ) : companies.map((co) => (
                <tr key={co.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{co.name}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">@{co.domain}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs hidden sm:table-cell">{co.city ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs">
                      <Users className="h-3 w-3" />{co._count.users}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                    {formatDate(co.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejected requests */}
      {rejected.length > 0 && (
        <details className="bg-card border border-border rounded-2xl">
          <summary className="px-5 py-4 cursor-pointer font-semibold text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" /> Rejected Requests ({rejected.length})
          </summary>
          <div className="px-5 pb-4 space-y-2">
            {rejected.map((req) => (
              <div key={req.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30">
                <div>
                  <p className="font-medium text-sm">{req.name}</p>
                  <p className="text-xs text-muted-foreground">@{req.domain} · {req.requestedBy} · {formatDate(req.createdAt)}</p>
                </div>
                <form action={`/api/admin/companies/${req.id}/approve`} method="POST">
                  <Button size="sm" variant="outline" type="submit" className="text-xs h-7">Re-approve</Button>
                </form>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
