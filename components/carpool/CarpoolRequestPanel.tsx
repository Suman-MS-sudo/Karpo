"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Car, MapPin, Loader2, CheckCircle2, XCircle, Clock,
  MessageSquare, ExternalLink, CreditCard, Map, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"

type RequestStatus = "PENDING" | "APPROVED" | "DECLINED" | "CANCELLED"

interface MyRequest {
  id:           string
  status:       RequestStatus
  pickupPoint:  string | null
  dropoffPoint: string | null
  pickupLat:    number | null
  pickupLng:    number | null
  dropoffLat:   number | null
  dropoffLng:   number | null
  seatsNeeded:  number
  paymentMode:  string | null
}

interface Stop { name: string; lat: number; lng: number }

interface Props {
  routeId:              string
  myRequest:            MyRequest | null
  driverName:           string
  seatsLeft:            number
  pickupPoints:         string[]
  monthlyPassAvailable: boolean
  monthlyPassPrice:     number | null
  pricePerSeat:         number
  fromLat?:    number
  fromLng?:    number
  toLat?:      number
  toLng?:      number
  routeStops?: Stop[]
}

const CarpoolPickupMap = dynamic(
  () => import("./CarpoolPickupMap").then((m) => m.CarpoolPickupMap),
  { ssr: false, loading: () => <div className="h-[260px] rounded-xl bg-muted animate-pulse border border-border" /> }
)

const CarpoolRiderRouteMap = dynamic(
  () => import("./CarpoolRiderRouteMap").then((m) => m.CarpoolRiderRouteMap),
  { ssr: false, loading: () => <div className="h-[260px] bg-muted animate-pulse" /> }
)

function getStatusMeta(status: RequestStatus) {
  const map: Record<RequestStatus, { label: string; icon: any; color: string; bg: string }> = {
    PENDING:   { label: "Request sent — awaiting driver approval",          icon: Clock,        color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" },
    APPROVED:  { label: "Seat confirmed! Check messages for details 🚗",    icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800" },
    DECLINED:  { label: "Seat not available this time",                     icon: XCircle,      color: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800" },
    CANCELLED: { label: "Request cancelled",                                icon: XCircle,      color: "text-slate-600 dark:text-slate-400",   bg: "bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800" },
  }
  return map[status]
}

const PAYMENT_LABELS: Record<string, string> = {
  CASH:    "Cash",
  UPI:     "UPI",
  MONTHLY: "Monthly pass",
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{ top: 56, left: 288, right: 0, bottom: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative bg-background rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: "90vh" }}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-8 w-8 rounded-full flex items-center justify-center bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

export function CarpoolRequestPanel({
  routeId, myRequest, driverName, seatsLeft,
  pickupPoints, monthlyPassAvailable, monthlyPassPrice, pricePerSeat,
  fromLat, fromLng, toLat, toLng, routeStops = [],
}: Props) {
  const router = useRouter()
  const [modalOpen, setModalOpen]       = useState(false)
  const [loading, setLoading]           = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [error, setError]               = useState("")
  const [useMap, setUseMap]             = useState(!!(fromLat && toLat))

  const [pickupPoint,  setPickupPoint]  = useState("")
  const [customPickup, setCustomPickup] = useState("")
  const [dropoffPoint, setDropoffPoint] = useState("")
  const [seatsNeeded,  setSeatsNeeded]  = useState("1")
  const [paymentMode,  setPaymentMode]  = useState("")
  const [message,      setMessage]      = useState("")

  const [pickupLat,   setPickupLat]   = useState<number | undefined>()
  const [pickupLng,   setPickupLng]   = useState<number | undefined>()
  const [dropoffLat,  setDropoffLat]  = useState<number | undefined>()
  const [dropoffLng,  setDropoffLng]  = useState<number | undefined>()
  const [pickupName,  setPickupName]  = useState("")
  const [dropoffName, setDropoffName] = useState("")

  const resolvedPickup  = useMap ? pickupName  : (pickupPoint === "__custom__" ? customPickup : pickupPoint)
  const resolvedDropoff = useMap ? dropoffName : dropoffPoint

  const hasMap = !!(fromLat && fromLng && toLat && toLng)

  function onPickupChange(lat: number, lng: number, name: string) {
    setPickupLat(lat); setPickupLng(lng); setPickupName(name)
  }
  function onDropoffChange(lat: number, lng: number, name: string) {
    setDropoffLat(lat); setDropoffLng(lng); setDropoffName(name)
  }

  async function submit() {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/carpool/${routeId}/requests`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          pickupPoint:  resolvedPickup  || undefined,
          pickupLat:    useMap ? pickupLat   : undefined,
          pickupLng:    useMap ? pickupLng   : undefined,
          dropoffPoint: resolvedDropoff || undefined,
          dropoffLat:   useMap ? dropoffLat  : undefined,
          dropoffLng:   useMap ? dropoffLng  : undefined,
          seatsNeeded:  Number(seatsNeeded),
          paymentMode:  paymentMode || undefined,
          message:      message     || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.existing) { router.refresh(); setModalOpen(false); return }
        setError(data.error ?? "Something went wrong"); return
      }
      setModalOpen(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function cancelRequest(requestId: string) {
    setCancelLoading(true)
    try {
      await fetch(`/api/carpool/${routeId}/requests/${requestId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "CANCEL" }),
      })
      router.refresh()
    } finally {
      setCancelLoading(false)
      setCancelConfirm(false)
    }
  }

  // ── Already requested ────────────────────────────────────────────────────────
  if (myRequest) {
    const meta = getStatusMeta(myRequest.status)
    const Icon = meta.icon

    const journeySteps = [
      { label: "Seat requested",                                         done: true },
      { label: "Driver reviews your request",                            done: ["APPROVED", "DECLINED"].includes(myRequest.status) },
      { label: "Seat confirmed — driver sends contact & pickup details", done: myRequest.status === "APPROVED" },
    ]

    return (
      <div className="space-y-3">
        <div className={`rounded-xl border p-4 ${meta.bg}`}>
          <div className={`flex items-center gap-2 font-semibold text-sm ${meta.color}`}>
            <Icon className="h-4 w-4 shrink-0" />
            {meta.label}
          </div>
          {myRequest.pickupPoint && (
            <p className="text-xs text-muted-foreground mt-1.5 ml-6 flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />Pickup: {myRequest.pickupPoint}
            </p>
          )}
          {myRequest.dropoffPoint && (
            <p className="text-xs text-muted-foreground mt-0.5 ml-6 flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />Drop-off: {myRequest.dropoffPoint}
            </p>
          )}
          {myRequest.paymentMode && (
            <p className="text-xs text-muted-foreground mt-0.5 ml-6 flex items-center gap-1">
              <CreditCard className="h-3 w-3 shrink-0" />Payment: {PAYMENT_LABELS[myRequest.paymentMode] ?? myRequest.paymentMode}
            </p>
          )}
        </div>

        {myRequest.status === "APPROVED" && hasMap && myRequest.pickupLat && myRequest.pickupLng && (
          <div className="rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 flex items-center gap-1.5">
              <Map className="h-3.5 w-3.5" />Your confirmed route
            </p>
            <CarpoolRiderRouteMap
              fromLat={fromLat!} fromLng={fromLng!}
              toLat={toLat!} toLng={toLng!}
              stops={routeStops}
              pickupLat={myRequest.pickupLat}
              pickupLng={myRequest.pickupLng}
              dropoffLat={myRequest.dropoffLat}
              dropoffLng={myRequest.dropoffLng}
              height={260}
            />
          </div>
        )}

        {myRequest.status !== "DECLINED" && myRequest.status !== "CANCELLED" && (
          <div className="space-y-1.5 px-1">
            {journeySteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${step.done ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {step.done ? "✓" : ""}
                </div>
                <span className={`text-xs ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</span>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" className="w-full gap-2" asChild>
          <a href="/messages">
            <MessageSquare className="h-4 w-4" />
            Message {driverName.split(" ")[0]}
          </a>
        </Button>

        {(myRequest.status === "PENDING" || myRequest.status === "APPROVED") && (
          cancelConfirm ? (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 p-3 space-y-2">
              <p className="text-xs text-red-700 dark:text-red-400 font-medium text-center">
                {myRequest.status === "APPROVED"
                  ? "Cancel your confirmed seat? The driver will be freed up to accept others."
                  : "Cancel your pending request?"}
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" className="text-xs h-8" onClick={() => setCancelConfirm(false)} disabled={cancelLoading}>Keep it</Button>
                <Button size="sm" className="text-xs h-8 bg-red-600 hover:bg-red-700 text-white border-0"
                  onClick={() => cancelRequest(myRequest.id)} disabled={cancelLoading}>
                  {cancelLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, cancel"}
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCancelConfirm(true)}
              className="w-full text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors py-1 underline underline-offset-2"
            >
              Cancel {myRequest.status === "APPROVED" ? "my seat" : "request"}
            </button>
          )
        )}
      </div>
    )
  }

  // ── Options view (sidebar) ───────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Join this carpool?</p>

        {seatsLeft === 0 ? (
          <div className="text-center py-4 bg-muted/50 rounded-xl text-xs text-muted-foreground">
            No seats available — check back later
          </div>
        ) : (
          <button
            onClick={() => setModalOpen(true)}
            className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-orange-200 dark:border-orange-700 bg-orange-50/60 dark:bg-orange-950/20 hover:bg-orange-100/60 dark:hover:bg-orange-900/30 transition-all text-left group"
          >
            <div className="h-9 w-9 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Car className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Request a Seat</p>
              <p className="text-xs text-muted-foreground">
                {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} available · {formatCurrency(pricePerSeat)}/trip
                {hasMap && " · pin your stop on the map"}
              </p>
            </div>
          </button>
        )}

        {monthlyPassAvailable && monthlyPassPrice && (
          <div className="flex items-center gap-2 text-xs bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-emerald-700 dark:text-emerald-300">
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
            Monthly pass: {formatCurrency(monthlyPassPrice)}/month — save vs per-trip
          </div>
        )}

        <button className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-violet-200 dark:border-violet-700 bg-violet-50/60 dark:bg-violet-950/20 hover:bg-violet-100/60 dark:hover:bg-violet-900/30 transition-all text-left group">
          <div className="h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <a href="/messages" className="flex-1">
            <p className="font-semibold text-sm">Ask the Driver</p>
            <p className="text-xs text-muted-foreground">Message {driverName.split(" ")[0]} directly</p>
          </a>
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* ── Request modal ──────────────────────────────────────────────────────── */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError("") }}>
        {/* Header — fixed */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold">Request a Seat</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} left · {formatCurrency(pricePerSeat)} per trip
          </p>
        </div>

        {/* Map section — NOT inside overflow-y-auto (Leaflet breaks inside scrollable containers) */}
        {hasMap && useMap && (
          <div className="px-6 pt-4 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Pickup &amp; Drop-off</label>
              <button type="button" onClick={() => setUseMap(false)}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                Use text instead
              </button>
            </div>
            <CarpoolPickupMap
              fromLat={fromLat!} fromLng={fromLng!}
              toLat={toLat!} toLng={toLng!}
              stops={routeStops}
              onPickupChange={onPickupChange}
              onDropoffChange={onDropoffChange}
              pickupLat={pickupLat} pickupLng={pickupLng}
              dropoffLat={dropoffLat} dropoffLng={dropoffLng}
              height={240}
            />
            {(pickupName || dropoffName) && (
              <div className="flex gap-4 mt-2 text-xs bg-muted/40 rounded-lg px-3 py-2">
                {pickupName  && <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500 shrink-0" /><span className="font-medium">Pickup:</span> {pickupName}</p>}
                {dropoffName && <p className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0" /><span className="font-medium">Drop-off:</span> {dropoffName}</p>}
              </div>
            )}
          </div>
        )}

        {/* Scrollable form fields */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">

          {/* Seats */}
          <div>
            <label className="text-sm font-medium block mb-1.5">Seats needed</label>
            <select value={seatsNeeded} onChange={(e) => setSeatsNeeded(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
              {Array.from({ length: Math.min(seatsLeft, 4) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n} seat{n > 1 ? "s" : ""}</option>
              ))}
            </select>
          </div>

          {/* Text-based pickup (when map toggled off or no map data) */}
          {(!hasMap || !useMap) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Pickup &amp; Drop-off</label>
                {hasMap && (
                  <button type="button" onClick={() => setUseMap(true)}
                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline">
                    Use map
                  </button>
                )}
              </div>
              <TextPickupInputs
                pickupPoints={pickupPoints}
                pickupPoint={pickupPoint} setPickupPoint={setPickupPoint}
                customPickup={customPickup} setCustomPickup={setCustomPickup}
                dropoffPoint={dropoffPoint} setDropoffPoint={setDropoffPoint}
              />
            </div>
          )}

          {/* Payment */}
          <div>
            <label className="text-sm font-medium block mb-2">Preferred payment</label>
            <div className="grid grid-cols-3 gap-2">
              {(monthlyPassAvailable ? ["CASH", "UPI", "MONTHLY"] : ["CASH", "UPI"]).map((pm) => (
                <button key={pm} type="button" onClick={() => setPaymentMode(pm)}
                  className={`text-sm py-2.5 rounded-lg border font-medium transition-all ${
                    paymentMode === pm
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400"
                      : "border-border text-muted-foreground hover:border-muted-foreground/50"
                  }`}>
                  {pm === "MONTHLY" && monthlyPassPrice ? `Pass (${formatCurrency(monthlyPassPrice)})` : PAYMENT_LABELS[pm]}
                </button>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 space-y-0.5">
              <p className="flex justify-between"><span>Per trip</span><span className="font-medium text-foreground">{formatCurrency(pricePerSeat)}</span></p>
              {monthlyPassAvailable && monthlyPassPrice && (
                <p className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Monthly pass</span><span className="font-medium">{formatCurrency(monthlyPassPrice)}</span>
                </p>
              )}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium block mb-1.5">
              Message to driver <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Any notes, special requests…"
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer — fixed */}
        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
          <Button variant="outline" className="flex-1 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30" onClick={() => { setModalOpen(false); setError("") }}>
            Cancel
          </Button>
          <Button className="flex-1 gap-2" disabled={loading} onClick={submit}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Car className="h-4 w-4" />}
            Send Request
          </Button>
        </div>
      </Modal>
    </>
  )
}

function TextPickupInputs({
  pickupPoints, pickupPoint, setPickupPoint,
  customPickup, setCustomPickup,
  dropoffPoint, setDropoffPoint,
}: {
  pickupPoints:     string[]
  pickupPoint:      string
  setPickupPoint:   (v: string) => void
  customPickup:     string
  setCustomPickup:  (v: string) => void
  dropoffPoint:     string
  setDropoffPoint:  (v: string) => void
}) {
  return (
    <>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">Your pickup point</label>
        {pickupPoints.length > 0 ? (
          <select value={pickupPoint} onChange={(e) => setPickupPoint(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring mb-2">
            <option value="">Select a stop…</option>
            {pickupPoints.map((p) => <option key={p} value={p}>{p}</option>)}
            <option value="__custom__">Other (specify below)</option>
          </select>
        ) : null}
        {(pickupPoints.length === 0 || pickupPoint === "__custom__") && (
          <input type="text" value={customPickup} onChange={(e) => setCustomPickup(e.target.value)}
            placeholder="e.g. Near Indiranagar Metro"
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
        )}
      </div>
      <div>
        <label className="text-xs font-medium text-muted-foreground block mb-1.5">
          Your drop-off point <span className="text-muted-foreground/60 font-normal">(optional)</span>
        </label>
        <input type="text" value={dropoffPoint} onChange={(e) => setDropoffPoint(e.target.value)}
          placeholder="e.g. Whitefield Tech Park Gate 3"
          className="w-full text-sm px-3 py-2.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
    </>
  )
}
