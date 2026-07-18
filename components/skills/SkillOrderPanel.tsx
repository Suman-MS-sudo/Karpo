"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Send, Loader2, CheckCircle2, Clock, XCircle, Package,
  Hammer, Truck, AlertTriangle, MessageSquare, Calendar,
  CreditCard, Link2, ChevronDown, ChevronUp, RotateCcw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface Pkg { name: string; price: number; durationHrs: number; description?: string; features: string[] }

interface Order {
  id:           string
  status:       string
  packageName:  string | null
  agreedPrice:  number
  counterPrice: number | null
  requirements: string | null
  buyerNote:    string | null
  sessionDate:  string | null
  sessionTime:  string | null
  meetLink:     string | null
  paymentMode:  string | null
  paymentStatus: string
  deliveryNote: string | null
  deliverables: string[]
  deliveredAt:  string | null
  completedAt:  string | null
  cancelReason: string | null
  disputeReason: string | null
}

interface Props {
  listingId:    string
  sellerId:     string
  sellerName:   string
  myOrder:      Order | null
  packages:     Pkg[]
  pricingModel: string
  hourlyRate:   number | null
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  INQUIRY:      { label: "Inquiry sent — awaiting seller review",         color: "text-blue-600 dark:text-blue-400",    bg: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",    icon: Clock },
  NEGOTIATING:  { label: "Counter-offer in progress",                     color: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800", icon: RotateCcw },
  CONFIRMED:    { label: "Order confirmed — session details below",        color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
  IN_PROGRESS:  { label: "Work in progress",                              color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800", icon: Hammer },
  DELIVERED:    { label: "Delivered! Please review and approve",           color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800", icon: Truck },
  COMPLETED:    { label: "Completed ✅ — don't forget to leave a review", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
  DECLINED:     { label: "Order declined by seller",                      color: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",       icon: XCircle },
  CANCELLED:    { label: "Order cancelled",                               color: "text-slate-600 dark:text-slate-400",  bg: "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800", icon: XCircle },
  DISPUTED:     { label: "Dispute raised — resolution in progress",       color: "text-red-600 dark:text-red-400",      bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",       icon: AlertTriangle },
}

const JOURNEY = [
  { key: "INQUIRY",     label: "Inquiry sent" },
  { key: "CONFIRMED",   label: "Order confirmed" },
  { key: "IN_PROGRESS", label: "Work in progress" },
  { key: "DELIVERED",   label: "Delivered" },
  { key: "COMPLETED",   label: "Completed" },
]
const JOURNEY_ORDER = ["INQUIRY","NEGOTIATING","CONFIRMED","IN_PROGRESS","DELIVERED","COMPLETED"]

function journeyStep(status: string) {
  const idx = JOURNEY_ORDER.indexOf(status)
  return idx === -1 ? 0 : idx
}

const PAYMENT_LABELS: Record<string, string> = { UPI: "UPI", TRANSFER: "Bank Transfer", CASH: "Cash", WALLET: "Wallet" }

export function SkillOrderPanel({ listingId, sellerId, sellerName, myOrder, packages, pricingModel, hourlyRate }: Props) {
  const router = useRouter()
  const [mode, setMode]     = useState<"options" | "form" | "counter" | "dispute">("options")
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")
  const [selectedPkg, setSelectedPkg] = useState(0)
  const [requirements, setRequirements] = useState("")
  const [buyerNote, setBuyerNote]     = useState("")
  const [paymentMode, setPaymentMode] = useState("")
  const [counterPrice, setCounterPrice] = useState("")
  const [disputeReason, setDisputeReason] = useState("")
  const [disputeNote, setDisputeNote]     = useState("")
  const [deliveryOpen, setDeliveryOpen] = useState(false)

  const pkg = packages[selectedPkg]
  const price = pricingModel === "HOURLY" ? hourlyRate : pkg?.price

  async function submitOrder() {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/skills/${listingId}/orders`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageName:  pkg?.name,
          packageIdx:   selectedPkg,
          agreedPrice:  price,
          requirements: requirements || undefined,
          buyerNote:    buyerNote    || undefined,
          paymentMode:  paymentMode  || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      router.refresh()
    } finally { setLoading(false) }
  }

  async function orderAction(action: string, extra: Record<string, any> = {}) {
    if (!myOrder) return
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/skills/${listingId}/orders/${myOrder.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return }
      router.refresh()
    } finally { setLoading(false) }
  }

  // ── Active order view ────────────────────────────────────────────────────────
  if (myOrder) {
    const meta  = STATUS_META[myOrder.status] ?? STATUS_META.INQUIRY
    const Icon  = meta.icon
    const step  = journeyStep(myOrder.status)
    const isTerminal = ["COMPLETED","DECLINED","CANCELLED","DISPUTED"].includes(myOrder.status)

    return (
      <div className="space-y-4">
        {/* Status banner */}
        <div className={`rounded-xl border p-4 ${meta.bg}`}>
          <div className={`flex items-center gap-2 font-semibold text-sm ${meta.color}`}>
            <Icon className="h-4 w-4 shrink-0" />{meta.label}
          </div>
          {myOrder.agreedPrice > 0 && (
            <p className="text-xs text-muted-foreground mt-1.5 ml-6">
              Agreed price: <span className="font-semibold text-foreground">{formatCurrency(myOrder.agreedPrice)}</span>
              {myOrder.packageName && <> · {myOrder.packageName} package</>}
            </p>
          )}
          {myOrder.paymentMode && (
            <p className="text-xs text-muted-foreground mt-0.5 ml-6 flex items-center gap-1">
              <CreditCard className="h-3 w-3" />Payment: {PAYMENT_LABELS[myOrder.paymentMode] ?? myOrder.paymentMode}
            </p>
          )}
        </div>

        {/* Journey tracker */}
        {!isTerminal && (
          <div className="space-y-2 px-1">
            {JOURNEY.map((s, i) => {
              const done    = i < step || (myOrder.status === s.key)
              const current = myOrder.status === s.key || (myOrder.status === "NEGOTIATING" && s.key === "INQUIRY")
              return (
                <div key={s.key} className="flex items-center gap-2.5">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold border-2 transition-all ${
                    done || current ? "border-primary-500 bg-primary-500 text-white" : "border-border bg-background text-muted-foreground"
                  }`}>
                    {done || current ? (i < step ? "✓" : "●") : ""}
                  </div>
                  <span className={`text-xs font-medium ${done || current ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                  {current && myOrder.status === "NEGOTIATING" && s.key === "INQUIRY" && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 ml-1">(Negotiating)</span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Session details (post-CONFIRMED) */}
        {(myOrder.status === "CONFIRMED" || myOrder.status === "IN_PROGRESS" || myOrder.status === "DELIVERED") && (myOrder.sessionDate || myOrder.meetLink) && (
          <div className="bg-muted/40 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Session Details</p>
            {myOrder.sessionDate && (
              <p className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4 text-primary-500" />
                {new Date(myOrder.sessionDate).toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"short" })}
                {myOrder.sessionTime && ` at ${myOrder.sessionTime}`}
              </p>
            )}
            {myOrder.meetLink && (
              <a href={myOrder.meetLink} target="_blank" rel="noopener noreferrer"
                className="text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline">
                <Link2 className="h-4 w-4" />Join meeting
              </a>
            )}
          </div>
        )}

        {/* Delivery */}
        {myOrder.status === "DELIVERED" && myOrder.deliveryNote && (
          <div className="border border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden">
            <button onClick={() => setDeliveryOpen((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-orange-50 dark:bg-orange-950/20 text-sm font-semibold text-orange-700 dark:text-orange-300">
              <span className="flex items-center gap-2"><Truck className="h-4 w-4" />Delivery Note</span>
              {deliveryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {deliveryOpen && (
              <div className="px-4 py-3 text-sm text-muted-foreground space-y-1">
                <p>{myOrder.deliveryNote}</p>
                {myOrder.deliverables.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {myOrder.deliverables.map((d, i) => <li key={i} className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />{d}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {/* Counter-offer response */}
        {myOrder.status === "NEGOTIATING" && (
          <div className="space-y-3">
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">Counter-offer: {formatCurrency(myOrder.counterPrice ?? myOrder.agreedPrice)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Seller proposed a new price. Accept, decline, or counter again.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button size="sm" className="text-xs" onClick={() => orderAction("ACCEPT")} disabled={loading}>Accept</Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setMode("counter")} disabled={loading}>Counter</Button>
              <Button size="sm" variant="destructive" className="text-xs" onClick={() => orderAction("DECLINE")} disabled={loading}>Decline</Button>
            </div>
            {mode === "counter" && (
              <div className="space-y-2">
                <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)} placeholder="Your counter price (₹)"
                  className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
                <Button size="sm" className="w-full text-xs" onClick={() => orderAction("COUNTER", { counterPrice: Number(counterPrice) })} disabled={loading || !counterPrice}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Send Counter-Offer"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Buyer actions on DELIVERED */}
        {myOrder.status === "DELIVERED" && (
          <div className="space-y-2">
            <Button className="w-full gap-2" onClick={() => orderAction("COMPLETE")} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Approve & Mark Complete
            </Button>
            <button onClick={() => setMode("dispute")}
              className="w-full text-xs text-red-500 hover:text-red-600 flex items-center justify-center gap-1.5 py-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />Raise a Dispute
            </button>
            {mode === "dispute" && (
              <div className="space-y-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">Raise Dispute</p>
                <input type="text" value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Brief reason (e.g. Incomplete delivery)"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-input bg-background focus:outline-none" />
                <textarea rows={2} value={disputeNote} onChange={(e) => setDisputeNote(e.target.value)} placeholder="Describe the issue in detail…"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-input bg-background focus:outline-none resize-none" />
                <Button size="sm" variant="destructive" className="w-full text-xs" disabled={loading || !disputeReason}
                  onClick={() => orderAction("DISPUTE", { disputeReason, disputeNote })}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit Dispute"}
                </Button>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>}

        <Button variant="outline" className="w-full gap-2" asChild>
          <a href="/messages"><MessageSquare className="h-4 w-4" />Message {sellerName.split(" ")[0]}</a>
        </Button>
      </div>
    )
  }

  // ── Order form ───────────────────────────────────────────────────────────────
  if (mode === "form") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm">Place an Order</p>
          <button onClick={() => setMode("options")} className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">Cancel</button>
        </div>

        {/* Package selector */}
        {packages.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Package</label>
            <div className="space-y-2">
              {packages.map((p, i) => (
                <button key={i} type="button" onClick={() => setSelectedPkg(i)}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all ${selectedPkg === i ? "border-primary-500 bg-primary/10" : "border-border hover:border-muted-foreground/50"}`}>
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${selectedPkg === i ? "border-primary-500 bg-primary-500" : "border-input"}`}>
                    {selectedPkg === i && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold">{p.name}</p>
                      <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(p.price)}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{p.durationHrs}h · {p.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Requirements */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Your requirements <span className="text-red-500">*</span></label>
          <textarea rows={3} value={requirements} onChange={(e) => setRequirements(e.target.value)}
            placeholder="Describe what you need, your goals, your current level…"
            className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>

        {/* Payment preference */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Preferred payment</label>
          <div className="grid grid-cols-2 gap-2">
            {["UPI", "TRANSFER", "CASH", "WALLET"].map((pm) => (
              <button key={pm} type="button" onClick={() => setPaymentMode(pm)}
                className={`text-xs py-2 rounded-lg border font-medium transition-all ${paymentMode === pm ? "border-primary-500 bg-primary/10 text-primary-700 dark:text-primary-400" : "border-border text-muted-foreground"}`}>
                {PAYMENT_LABELS[pm]}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Note to seller <span className="text-muted-foreground/60 font-normal">(optional)</span></label>
          <textarea rows={2} value={buyerNote} onChange={(e) => setBuyerNote(e.target.value)}
            placeholder="Timeline, scheduling preferences, anything else…"
            className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
        </div>

        {/* Price summary */}
        <div className="bg-muted/40 rounded-xl p-3 text-xs space-y-1">
          {packages.length > 0 && <p className="flex justify-between"><span className="text-muted-foreground">Package</span><span className="font-medium">{pkg?.name}</span></p>}
          <p className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{pkg?.durationHrs}h</span></p>
          <p className="flex justify-between font-semibold text-sm pt-1 border-t border-border"><span>Total</span><span className="text-primary-600 dark:text-primary-400">{formatCurrency(price ?? 0)}</span></p>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <Button className="w-full gap-2" disabled={loading || !requirements.trim()} onClick={submitOrder}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Send Inquiry
        </Button>
      </div>
    )
  }

  // ── Initial CTA ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <button onClick={() => setMode("form")}
        className="w-full flex items-center gap-3 p-4 rounded-xl border border-primary-200 dark:border-primary-700 bg-primary/5 hover:bg-primary/10 transition-all text-left group">
        <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Package className="h-4 w-4 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p className="font-semibold text-sm">Place an Order</p>
          <p className="text-xs text-muted-foreground">Choose a package and submit your requirements</p>
        </div>
      </button>
      <Button variant="outline" className="w-full gap-2" asChild>
        <a href="/messages"><MessageSquare className="h-4 w-4" />Ask {sellerName.split(" ")[0]} a Question</a>
      </Button>
    </div>
  )
}
