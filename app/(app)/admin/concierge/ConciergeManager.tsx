"use client"
import { useState } from "react"
import { Shield, ChevronDown, Loader2, Calendar } from "lucide-react"
import { formatRelativeTime } from "@/lib/utils"
import Link from "next/link"

interface Lead {
  id: string; serviceType: string; description: string; status: string
  urgency: string; budget: number | null; phone: string | null; notes: string | null
  assignedProId: string | null; createdAt: Date | string
  user: { id: string; name: string | null; email: string | null; company: { name: string } | null }
}

const STATUSES = ["PENDING","IN_REVIEW","IN_PROGRESS","COMPLETED","CANCELLED"]
const STATUS_COLOR: Record<string, string> = {
  PENDING:     "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  IN_REVIEW:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  COMPLETED:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  CANCELLED:   "bg-muted text-muted-foreground",
}
const URGENCY_COLOR: Record<string, string> = {
  URGENT: "text-red-600 font-semibold",
  NORMAL: "text-muted-foreground",
  LOW:    "text-muted-foreground",
}
const SERVICE_EMOJI: Record<string, string> = { TAX: "📄", LEGAL: "⚖️", INSURANCE: "🛡️", FINANCIAL: "📈" }
const TABS = ["all", ...STATUSES]

export function ConciergeManager({ leads: initial, activeStatus }: { leads: Lead[]; activeStatus: string }) {
  const [leads, setLeads]   = useState(initial)
  const [updating, setUpdating] = useState<string | null>(null)

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    try {
      const res = await fetch(`/api/admin/concierge/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setLeads((l) => l.map((x) => x.id === id ? { ...x, status } : x))
      }
    } finally { setUpdating(null) }
  }

  const counts: Record<string, number> = { all: leads.length }
  for (const s of STATUSES) counts[s] = leads.filter((l) => l.status === s).length

  const visible = activeStatus === "all" ? leads : leads.filter((l) => l.status === activeStatus)

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2"><Shield className="h-5 w-5" /> Concierge Leads</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{leads.length} total leads</p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((tab) => (
          <Link key={tab} href={tab === "all" ? "/admin/concierge" : `/admin/concierge?status=${tab}`}>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-colors capitalize ${
              activeStatus === tab
                ? "bg-primary-600 text-white border-primary-600"
                : "border-border text-muted-foreground hover:border-foreground/30"
            }`}>
              {tab.toLowerCase().replace("_", " ")}
              <span className="text-[10px] font-bold">{counts[tab] ?? 0}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Leads */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No leads in this status</p>
          </div>
        )}
        {visible.map((lead) => (
          <div key={lead.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="font-medium text-sm">
                    {SERVICE_EMOJI[lead.serviceType] ?? "📋"} {lead.serviceType} Request
                  </span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_COLOR[lead.status] ?? ""}`}>
                    {lead.status.replace("_", " ")}
                  </span>
                  <span className={`text-[11px] ${URGENCY_COLOR[lead.urgency] ?? ""}`}>
                    {lead.urgency}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formatRelativeTime(new Date(lead.createdAt))}
                </p>
              </div>

              {/* Status changer */}
              <div className="relative flex items-center gap-2">
                {updating === lead.id && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                <div className="relative">
                  <select
                    value={lead.status}
                    disabled={updating === lead.id}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="appearance-none pr-7 pl-3 py-1.5 text-xs border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl text-xs">
              <div className="h-7 w-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300 shrink-0">
                {lead.user.name?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="font-medium truncate">{lead.user.name ?? "Unknown"}</p>
                <p className="text-muted-foreground truncate">{lead.user.company?.name ?? lead.user.email}</p>
              </div>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="ml-auto text-primary-600 hover:underline shrink-0">
                  {lead.phone}
                </a>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">{lead.description}</p>

            {/* Budget */}
            {lead.budget && (
              <p className="text-xs text-muted-foreground">Budget: ₹{lead.budget.toLocaleString("en-IN")}</p>
            )}

            {/* Notes */}
            {lead.notes && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                Notes: {lead.notes}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
