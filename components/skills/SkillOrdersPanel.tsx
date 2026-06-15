"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, ChevronUp, Loader2, Calendar, Link2, CheckCircle2, Package, Clock, BadgeCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

interface Buyer {
  id: string; name: string | null; avatarUrl: string | null; image: string | null
  email: string | null; jobTitle: string | null; department: string | null; isVerified: boolean
  company: { name: string } | null
}
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
  deliverables: string[]
  createdAt:    string
  buyer:        Buyer
  review:       { id: string; rating: number; headline: string | null } | null
}

interface Props {
  listingId: string
  initialCount: number
}

const STATUS_STYLE: Record<string, string> = {
  INQUIRY:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  NEGOTIATING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  CONFIRMED:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  IN_PROGRESS: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  DELIVERED:   "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  COMPLETED:   "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  DECLINED:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  CANCELLED:   "bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400",
  DISPUTED:    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
}

const SELLER_ACTIONS: Record<string, { action: string; label: string; variant?: "default" | "outline" | "destructive" }[]> = {
  INQUIRY:     [{ action: "CONFIRM", label: "Confirm Order" }, { action: "COUNTER", label: "Counter Offer", variant: "outline" }, { action: "DECLINE", label: "Decline", variant: "destructive" }],
  NEGOTIATING: [{ action: "CONFIRM", label: "Confirm" }, { action: "DECLINE", label: "Decline", variant: "destructive" }],
  CONFIRMED:   [{ action: "START", label: "Start Work" }],
  IN_PROGRESS: [{ action: "DELIVER", label: "Mark as Delivered" }],
}

function Stars({ n }: { n: number }) {
  return <span className="text-amber-400 text-xs">{"★".repeat(n)}{"☆".repeat(5 - n)}</span>
}

function OrderCard({ order, listingId }: { order: Order; listingId: string }) {
  const router = useRouter()
  const [open, setOpen]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")
  const [counterPrice, setCounterPrice] = useState("")
  const [sessionDate, setSessionDate]   = useState(order.sessionDate?.slice(0, 10) ?? "")
  const [sessionTime, setSessionTime]   = useState(order.sessionTime ?? "")
  const [meetLink, setMeetLink]         = useState(order.meetLink ?? "")
  const [deliveryNote, setDeliveryNote] = useState("")
  const [deliverables, setDeliverables] = useState([""])

  const avatar = order.buyer.avatarUrl ?? order.buyer.image
  const actions = SELLER_ACTIONS[order.status] ?? []

  async function doAction(action: string) {
    setLoading(true); setError("")
    try {
      const extra: Record<string, any> = {}
      if (action === "COUNTER")  extra.counterPrice = Number(counterPrice)
      if (action === "CONFIRM" || action === "START") {
        if (sessionDate) extra.sessionDate = sessionDate
        if (sessionTime) extra.sessionTime = sessionTime
        if (meetLink)    extra.meetLink    = meetLink
      }
      if (action === "DELIVER") {
        extra.deliveryNote  = deliveryNote
        extra.deliverables  = deliverables.filter(Boolean)
      }
      const res = await fetch(`/api/skills/${listingId}/orders/${order.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error"); return }
      router.refresh()
    } finally { setLoading(false) }
  }

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      {/* Summary row */}
      <button className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setOpen((v) => !v)}>
        <div className="shrink-0">
          {avatar
            ? <img src={avatar} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-border" />
            : <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                {order.buyer.name?.[0] ?? "?"}
              </div>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-semibold text-sm truncate">{order.buyer.name}</p>
            {order.buyer.isVerified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{order.buyer.jobTitle ?? order.buyer.department ?? order.buyer.email}</p>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[order.status]}`}>{order.status.replace("_"," ")}</span>
          <p className="text-xs text-muted-foreground">{formatCurrency(order.agreedPrice)}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
      </button>

      {open && (
        <div className="border-t border-border px-5 py-4 space-y-4 bg-muted/20">
          {/* Order details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            {order.packageName && <div><p className="text-muted-foreground">Package</p><p className="font-medium">{order.packageName}</p></div>}
            <div><p className="text-muted-foreground">Price</p><p className="font-medium">{formatCurrency(order.agreedPrice)}</p></div>
            <div><p className="text-muted-foreground">Placed</p><p className="font-medium">{new Date(order.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short" })}</p></div>
            {order.paymentMode && <div><p className="text-muted-foreground">Payment</p><p className="font-medium">{order.paymentMode}</p></div>}
          </div>

          {order.requirements && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Buyer Requirements</p>
              <p className="text-sm bg-background border border-border rounded-lg px-3 py-2">{order.requirements}</p>
            </div>
          )}
          {order.buyerNote && (
            <p className="text-xs text-muted-foreground italic">Note: {order.buyerNote}</p>
          )}

          {/* Negotiation */}
          {order.status === "INQUIRY" || order.status === "NEGOTIATING" ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="number" value={counterPrice} onChange={(e) => setCounterPrice(e.target.value)}
                  placeholder="Counter price (₹)" className="flex-1 text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          ) : null}

          {/* Session scheduling for CONFIRM */}
          {(order.status === "INQUIRY" || order.status === "NEGOTIATING" || order.status === "CONFIRMED") && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Session date</label>
                <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-background focus:outline-none" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground">Time</label>
                <input type="time" value={sessionTime} onChange={(e) => setSessionTime(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-background focus:outline-none" />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[11px] text-muted-foreground">Meeting link</label>
                <input type="url" value={meetLink} onChange={(e) => setMeetLink(e.target.value)} placeholder="https://meet.google.com/…"
                  className="w-full text-xs px-2 py-1.5 rounded-lg border border-input bg-background focus:outline-none" />
              </div>
            </div>
          )}

          {/* Delivery form */}
          {order.status === "IN_PROGRESS" && (
            <div className="space-y-2">
              <textarea rows={2} value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="Delivery note to buyer…"
                className="w-full text-sm px-3 py-2 rounded-lg border border-input bg-background focus:outline-none resize-none" />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Deliverables list</p>
                {deliverables.map((d, i) => (
                  <input key={i} value={d} onChange={(e) => setDeliverables((prev) => { const n = [...prev]; n[i] = e.target.value; return n })}
                    placeholder={`Item ${i + 1}…`}
                    className="w-full text-xs px-3 py-1.5 rounded-lg border border-input bg-background focus:outline-none" />
                ))}
                <button onClick={() => setDeliverables((p) => [...p, ""])} className="text-xs text-primary-600 dark:text-primary-400 hover:underline">+ Add item</button>
              </div>
            </div>
          )}

          {/* Review */}
          {order.review && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Stars n={order.review.rating} />
                <p className="text-xs font-semibold">{order.review.headline}</p>
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Action buttons */}
          {actions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => (
                <Button key={a.action} size="sm" variant={a.variant ?? "default"}
                  className="text-xs flex-1" disabled={loading}
                  onClick={() => doAction(a.action)}>
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : a.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function SkillOrdersPanel({ listingId, initialCount }: Props) {
  const [open, setOpen]     = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)

  async function load() {
    if (loaded) { setOpen(true); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/skills/${listingId}/orders`)
      if (res.ok) { const d = await res.json(); setOrders(d.orders); setLoaded(true) }
    } finally { setLoading(false); setOpen(true) }
  }

  const pending   = orders.filter((o) => ["INQUIRY","NEGOTIATING"].includes(o.status))
  const active    = orders.filter((o) => ["CONFIRMED","IN_PROGRESS","DELIVERED"].includes(o.status))
  const completed = orders.filter((o) => ["COMPLETED","DECLINED","CANCELLED","DISPUTED"].includes(o.status))

  const earned = orders.filter((o) => o.status === "COMPLETED").reduce((s, o) => s + o.agreedPrice, 0)

  return (
    <div className="space-y-2">
      <button onClick={() => (open ? setOpen(false) : load())}
        className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-border hover:bg-muted/30 transition-all text-left">
        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
          <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Manage Orders</p>
          <p className="text-xs text-muted-foreground">{initialCount} order{initialCount !== 1 ? "s" : ""} · {formatCurrency(earned)} earned</p>
        </div>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />)}
      </button>

      {open && (
        <div className="space-y-4">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Pending", value: pending.length, color: "text-blue-600 dark:text-blue-400" },
              { label: "Active",  value: active.length,  color: "text-violet-600 dark:text-violet-400" },
              { label: "Done",    value: completed.filter(o => o.status === "COMPLETED").length, color: "text-emerald-600 dark:text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="bg-muted/40 rounded-xl p-2.5">
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          {pending.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Clock className="h-3 w-3" />Pending Review ({pending.length})</p>
              {pending.map((o) => <OrderCard key={o.id} order={o} listingId={listingId} />)}
            </div>
          )}
          {active.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Package className="h-3 w-3" />Active Orders ({active.length})</p>
              {active.map((o) => <OrderCard key={o.id} order={o} listingId={listingId} />)}
            </div>
          )}
          {completed.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" />History ({completed.length})</p>
              {completed.map((o) => <OrderCard key={o.id} order={o} listingId={listingId} />)}
            </div>
          )}
          {orders.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">No orders yet. Share your listing to get started!</p>
          )}
        </div>
      )}
    </div>
  )
}
