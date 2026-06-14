import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus, Shield, Clock, CheckCircle, AlertCircle, XCircle, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime } from "@/lib/utils"

export const metadata = { title: "My Concierge Requests" }
export const dynamic  = "force-dynamic"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING:     { label: "Pending",     color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",    icon: Clock       },
  IN_REVIEW:   { label: "In Review",   color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",        icon: FileText    },
  IN_PROGRESS: { label: "In Progress", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",icon: Clock       },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",    icon: CheckCircle },
  CANCELLED:   { label: "Cancelled",   color: "bg-muted text-muted-foreground",                                           icon: XCircle     },
}

const URGENCY_COLOR: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  NORMAL: "bg-muted text-muted-foreground",
  LOW:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
}

const SERVICE_LABEL: Record<string, string> = {
  TAX: "Tax Filing", LEGAL: "Legal Assistance", INSURANCE: "Insurance Advisory", FINANCIAL: "Financial Planning",
}
const SERVICE_EMOJI: Record<string, string> = {
  TAX: "📄", LEGAL: "⚖️", INSURANCE: "🛡️", FINANCIAL: "📈",
}

export default async function MyLeadsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/signin")

  const leads = await prisma.conciergeLead.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  const activeLeads    = leads.filter((l) => !["COMPLETED","CANCELLED"].includes(l.status))
  const completedLeads = leads.filter((l) => l.status === "COMPLETED")
  const cancelledLeads = leads.filter((l) => l.status === "CANCELLED")

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">My Concierge Requests</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Track all your service requests</p>
        </div>
        <Button asChild>
          <Link href="/concierge/new"><Plus className="h-4 w-4" /> New Request</Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {[
          { label: "Total",     value: leads.length      },
          { label: "Active",    value: activeLeads.length    },
          { label: "Completed", value: completedLeads.length },
          { label: "Cancelled", value: cancelledLeads.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border rounded-2xl">
          <Shield className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="font-medium mb-1">No requests yet</p>
          <p className="text-muted-foreground text-sm mb-4">Submit a concierge request for tax, legal, insurance, or financial guidance.</p>
          <Button asChild size="sm">
            <Link href="/concierge"><Plus className="h-4 w-4 mr-1" />New Request</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => {
            const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.PENDING
            const StatusIcon = cfg.icon
            return (
              <Link key={lead.id} href={`/concierge/${lead.id}`} className="block group">
                <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-sm transition-all hover:border-primary-200 dark:hover:border-primary-800">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-lg">
                        {SERVICE_EMOJI[lead.serviceType] ?? "📋"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p className="font-semibold text-sm">{SERVICE_LABEL[lead.serviceType] ?? lead.serviceType}</p>
                          {lead.urgency === "URGENT" && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              URGENT
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{lead.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelativeTime(lead.createdAt)}</span>
                          {lead.budget && <span>Budget: ₹{lead.budget.toLocaleString()}</span>}
                          {lead.timeline && <span>Timeline: {lead.timeline}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.color}`}>
                        <StatusIcon className="h-3 w-3" />{cfg.label}
                      </span>
                      {lead.notes && (
                        <span className="text-[10px] text-primary-600 dark:text-primary-400">Has notes</span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
