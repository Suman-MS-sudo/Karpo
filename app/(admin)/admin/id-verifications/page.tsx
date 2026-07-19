import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { BadgeCheck, Clock, CheckCircle, XCircle, Phone, Mail, Briefcase, RefreshCw } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

function RequestTypeBadge({ req }: { req: { requestType: string; user: { name: string | null; email: string | null } | null } }) {
  if (req.requestType !== "REVERIFICATION") return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400">
      <RefreshCw className="h-2.5 w-2.5" />
      Existing user · {req.user?.name ?? req.user?.email ?? "unknown"}
    </span>
  )
}

export default async function AdminIdVerificationsPage() {
  const requests = await prisma.idVerificationRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  })

  const pending  = requests.filter((r) => r.status === "PENDING")
  const approved = requests.filter((r) => r.status === "APPROVED")
  const rejected = requests.filter((r) => r.status === "REJECTED")

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><BadgeCheck className="h-5 w-5" /> ID Card Verifications</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {pending.length} pending · {approved.length} approved · {rejected.length} rejected
        </p>
      </div>

      {pending.length > 0 && (
        <div className="bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <Clock className="h-4 w-4" /> Pending Review ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((req) => (
              <div key={req.id} className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{req.fullName}</p>
                      <RequestTypeBadge req={req} />
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {req.corpEmail}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {req.phone}</p>
                    {req.designation && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1"><Briefcase className="h-3 w-3" /> {req.designation}{req.employeeId && ` · ID ${req.employeeId}`}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{formatRelativeTime(req.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={`/api/admin/id-verifications/${req.id}/approve`} method="POST">
                      <Button size="sm" type="submit" className="gap-1.5">
                        <CheckCircle className="h-3.5 w-3.5" /> Approve
                      </Button>
                    </form>
                    <form action={`/api/admin/id-verifications/${req.id}/reject`} method="POST">
                      <Button size="sm" variant="outline" type="submit" className="gap-1.5">
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </form>
                  </div>
                </div>
                <div className="flex gap-3 mt-3">
                  <a href={req.frontImageUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={req.frontImageUrl} alt="ID front" className="h-28 w-44 object-cover rounded-lg border border-border" />
                  </a>
                  <a href={req.backImageUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={req.backImageUrl} alt="ID back" className="h-28 w-44 object-cover rounded-lg border border-border" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
          No pending ID card verifications
        </div>
      )}

      {rejected.length > 0 && (
        <details className="bg-card border border-border rounded-2xl">
          <summary className="px-5 py-4 cursor-pointer font-semibold text-sm flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" /> Rejected ({rejected.length})
          </summary>
          <div className="px-5 pb-4 space-y-2">
            {rejected.map((req) => (
              <div key={req.id} className="p-3 rounded-xl bg-muted/30">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{req.fullName}</p>
                      <RequestTypeBadge req={req} />
                    </div>
                    <p className="text-xs text-muted-foreground">{req.corpEmail} · {req.phone} · {formatRelativeTime(req.createdAt)}</p>
                  </div>
                  <form action={`/api/admin/id-verifications/${req.id}/approve`} method="POST">
                    <Button size="sm" variant="outline" type="submit" className="text-xs h-7">Re-approve</Button>
                  </form>
                </div>
                <div className="flex gap-3 mt-3">
                  <a href={req.frontImageUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={req.frontImageUrl} alt="ID front" className="h-28 w-44 object-cover rounded-lg border border-border" />
                  </a>
                  <a href={req.backImageUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={req.backImageUrl} alt="ID back" className="h-28 w-44 object-cover rounded-lg border border-border" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}

      {approved.length > 0 && (
        <details className="bg-card border border-border rounded-2xl">
          <summary className="px-5 py-4 cursor-pointer font-semibold text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" /> Approved ({approved.length})
          </summary>
          <div className="px-5 pb-4 space-y-2">
            {approved.map((req) => (
              <div key={req.id} className="p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{req.fullName}</p>
                  <RequestTypeBadge req={req} />
                </div>
                <p className="text-xs text-muted-foreground">{req.corpEmail} · {req.phone} · {formatRelativeTime(req.createdAt)}</p>
                <div className="flex gap-3 mt-3">
                  <a href={req.frontImageUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={req.frontImageUrl} alt="ID front" className="h-28 w-44 object-cover rounded-lg border border-border" />
                  </a>
                  <a href={req.backImageUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <img src={req.backImageUrl} alt="ID back" className="h-28 w-44 object-cover rounded-lg border border-border" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
