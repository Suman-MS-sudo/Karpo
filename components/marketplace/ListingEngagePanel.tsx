"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Star, Calendar, MessageSquare, Loader2, CheckCircle2,
  XCircle, Clock, ArrowUpRight, Handshake,
} from "lucide-react"
import { Button } from "@/components/ui/button"

type EngagementStatus = "PENDING" | "CONFIRMED" | "DECLINED" | "DONE" | "ACCEPTED"

interface Engagement {
  id:        string
  type:      "INTEREST" | "VISIT"
  status:    EngagementStatus
  visitDate: string | null
  visitTime: string | null
}

interface Props {
  listingId:     string
  myEngagement:  Engagement | null
  sellerName:    string
  isNegotiable?: boolean
}

// Status label varies by (type, status) pair
function getStatusMeta(type: "INTEREST" | "VISIT", status: EngagementStatus) {
  if (type === "VISIT" && status === "ACCEPTED") {
    return { label: "Deal confirmed! 🎉", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" }
  }
  if (type === "VISIT" && status === "DONE") {
    return { label: "Visit completed — awaiting seller's decision", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" }
  }
  const map: Record<EngagementStatus, { label: string; icon: any; color: string; bg: string }> = {
    PENDING:   { label: type === "VISIT" ? "Visit requested — awaiting confirmation" : "Interest noted — awaiting seller", icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
    CONFIRMED: { label: "Visit confirmed! Check messages for details", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
    ACCEPTED:  { label: "Seller accepted your interest", icon: CheckCircle2, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800" },
    DECLINED:  { label: "Seller passed on this",   icon: XCircle,      color: "text-red-600 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
    DONE:      { label: "Visit completed",          icon: CheckCircle2, color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800" },
  }
  return map[status] ?? map.PENDING
}

const TIME_SLOTS = ["MORNING", "AFTERNOON", "EVENING"]
const TIME_LABELS: Record<string, string> = {
  MORNING:   "Morning (9am–12pm)",
  AFTERNOON: "Afternoon (12pm–5pm)",
  EVENING:   "Evening (5pm–8pm)",
}

export function ListingEngagePanel({ listingId, myEngagement, sellerName, isNegotiable }: Props) {
  const router = useRouter()
  const [mode, setMode]       = useState<"options" | "visit">("options")
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  // Visit form state
  const [visitDate, setVisitDate] = useState("")
  const [visitTime, setVisitTime] = useState("AFTERNOON")

  async function post(type: string, extra?: object) {
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/listings/${listingId}/engagements`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.existing) { router.refresh(); return }
        setError(data.error ?? "Something went wrong")
        return
      }
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  // ── Already engaged ────────────────────────────────────────────────────────
  if (myEngagement) {
    const meta   = getStatusMeta(myEngagement.type, myEngagement.status)
    const Icon   = meta.icon
    const isDealDone      = myEngagement.type === "VISIT" && myEngagement.status === "ACCEPTED"
    const isDeclined      = myEngagement.status === "DECLINED"
    const canUpgradeToVisit = myEngagement.type === "INTEREST" && (myEngagement.status === "PENDING" || myEngagement.status === "ACCEPTED")

    // Journey steps for each path
    const journeySteps = myEngagement.type === "VISIT" ? [
      { label: "Interest shown",      done: true },
      { label: "Visit requested",     done: true },
      { label: "Visit confirmed",     done: ["CONFIRMED", "DONE", "ACCEPTED"].includes(myEngagement.status) },
      { label: "Visit completed",     done: ["DONE", "ACCEPTED"].includes(myEngagement.status) },
      { label: "Deal agreed",         done: myEngagement.status === "ACCEPTED" },
    ] : [
      { label: "Interest shown",      done: true },
      { label: "Seller responds",     done: ["ACCEPTED", "DECLINED"].includes(myEngagement.status) },
      { label: "Schedule a visit",    done: false, active: myEngagement.status === "ACCEPTED" && !isDealDone },
    ]

    return (
      <div className="space-y-3">
        {/* Status banner */}
        <div className={`rounded-xl border p-4 ${meta.bg}`}>
          <div className={`flex items-center gap-2 font-semibold text-sm ${meta.color}`}>
            <Icon className="h-4 w-4 shrink-0" />
            {meta.label}
          </div>
          {myEngagement.type === "VISIT" && myEngagement.visitDate && (
            <p className="text-xs text-muted-foreground mt-1.5 ml-6">
              {new Date(myEngagement.visitDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
              {myEngagement.visitTime ? ` · ${TIME_LABELS[myEngagement.visitTime]}` : ""}
            </p>
          )}
        </div>

        {/* Journey tracker */}
        {!isDeclined && (
          <div className="space-y-1.5 px-1">
            {journeySteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
                  step.done
                    ? "bg-emerald-500 text-white"
                    : (step as any).active
                      ? "border-2 border-emerald-400 dark:border-emerald-600 bg-transparent"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {step.done ? "✓" : ""}
                </div>
                <span className={`text-xs ${
                  step.done ? "text-foreground" :
                  (step as any).active ? "text-emerald-600 dark:text-emerald-400 font-semibold" :
                  "text-muted-foreground"
                }`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Next action CTAs */}
        {canUpgradeToVisit && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground text-center font-medium">
              {myEngagement.status === "ACCEPTED" ? "Ready to see it in person?" : "Want to take the next step?"}
            </p>
            <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setMode("visit")}>
              <Calendar className="h-4 w-4" /> Schedule a Site Visit
            </Button>
          </div>
        )}

        {myEngagement.type === "VISIT" && myEngagement.status === "DONE" && (
          <p className="text-xs text-center text-muted-foreground pt-1">
            The seller will update the deal status shortly.
          </p>
        )}

        {isDeclined && (
          <Button variant="outline" className="w-full gap-2" asChild>
            <a href="/messages">
              <MessageSquare className="h-4 w-4" /> Message {sellerName.split(" ")[0]}
            </a>
          </Button>
        )}
      </div>
    )
  }

  // ── Visit form ────────────────────────────────────────────────────────────
  if (mode === "visit") {
    const minDate = new Date(); minDate.setDate(minDate.getDate() + 1)
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">Request a Site Visit</p>
          <button onClick={() => setMode("options")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Preferred date</label>
            <input
              type="date"
              value={visitDate}
              min={minDate.toISOString().split("T")[0]}
              onChange={(e) => setVisitDate(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Preferred time</label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((slot) => (
                <button key={slot}
                  onClick={() => setVisitTime(slot)}
                  className={`text-xs py-2 rounded-lg border font-medium transition-all ${
                    visitTime === slot
                      ? "border-primary-600 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400"
                      : "border-border hover:border-border/70 text-muted-foreground"
                  }`}>
                  {slot.charAt(0) + slot.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button className="w-full gap-2" disabled={!visitDate || loading}
          onClick={() => post("VISIT", { visitDate, visitTime })}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
          Send Visit Request
        </Button>
      </div>
    )
  }

  // ── Initial options ───────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interested?</p>

      {error && <p className="text-xs text-red-500">{error}</p>}

      {/* Show Interest */}
      <button
        disabled={loading}
        onClick={() => post("INTEREST")}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50/60 dark:bg-amber-950/20 hover:bg-amber-100/60 dark:hover:bg-amber-900/30 transition-all text-left group disabled:opacity-50">
        <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-amber-600 dark:text-amber-400" /> : <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />}
        </div>
        <div>
          <p className="font-semibold text-sm">Show Interest</p>
          <p className="text-xs text-muted-foreground">Let the seller know you're interested</p>
        </div>
      </button>

      {/* Request Site Visit */}
      <button
        disabled={loading}
        onClick={() => setMode("visit")}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/60 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-all text-left group disabled:opacity-50">
        <div className="h-9 w-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <p className="font-semibold text-sm">Request Site Visit</p>
          <p className="text-xs text-muted-foreground">Schedule a time to see the item in person</p>
        </div>
      </button>

      {/* Make Offer (negotiable only) */}
      {isNegotiable && (
        <button
          disabled={loading}
          onClick={() => {
            document.getElementById("offer-button-trigger")?.click()
          }}
          className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 transition-all text-left group disabled:opacity-50">
          <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Handshake className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Make an Offer</p>
            <p className="text-xs text-muted-foreground">Propose a price and negotiate</p>
          </div>
        </button>
      )}

      <button
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-violet-200 dark:border-violet-700 bg-violet-50/60 dark:bg-violet-950/20 hover:bg-violet-100/60 dark:hover:bg-violet-900/30 transition-all text-left group">
        <div className="h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <a href="/messages" className="flex-1">
          <p className="font-semibold text-sm">Ask a Question</p>
          <p className="text-xs text-muted-foreground">Message the seller directly</p>
        </a>
        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  )
}
