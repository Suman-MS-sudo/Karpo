"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import {
  Users, ChevronDown, ChevronUp, Loader2, CheckCircle2,
  XCircle, Clock, Car, MapPin,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatRelativeTime, getInitials } from "@/lib/utils"
import type { RiderPoint } from "./CarpoolOwnerMap"

interface Rider {
  id:         string
  name:       string | null
  email:      string | null
  phone:      string | null
  avatarUrl:  string | null
  image:      string | null
  isVerified: boolean
  jobTitle:   string | null
  department: string | null
  company:    { name: string } | null
}

interface CarpoolRequest {
  id:           string
  status:       string
  pickupPoint:  string | null
  dropoffPoint: string | null
  pickupLat:    number | null
  pickupLng:    number | null
  dropoffLat:   number | null
  dropoffLng:   number | null
  seatsNeeded:  number
  paymentMode:  string | null
  message:      string | null
  createdAt:    string
  user:         Rider
}

interface Stop { name: string; lat: number; lng: number }

interface Props {
  routeId:      string
  initialCount: number
  fromLat?:     number
  fromLng?:     number
  toLat?:       number
  toLng?:       number
  stops?:       Stop[]
}

const CarpoolOwnerMap = dynamic(
  () => import("./CarpoolOwnerMap").then((m) => m.CarpoolOwnerMap),
  { ssr: false, loading: () => <div className="h-[380px] mt-4 rounded-2xl bg-muted animate-pulse border border-border" /> }
)

const STATUS_BADGE: Record<string, string> = {
  PENDING:   "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300",
  APPROVED:  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300",
  DECLINED:  "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
  CANCELLED: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
}

function RiderCard({ request, routeId }: { request: CarpoolRequest; routeId: string }) {
  const router    = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const rider     = request.user
  const isPending = request.status === "PENDING"

  async function act(action: string) {
    setLoading(action)
    try {
      await fetch(`/api/carpool/${routeId}/requests/${request.id}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action }),
      })
      router.refresh()
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="border border-border rounded-xl p-4 space-y-3 bg-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage src={rider.avatarUrl ?? rider.image ?? ""} />
            <AvatarFallback className="text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700">
              {getInitials(rider.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{rider.name ?? "Anonymous"}</p>
              {rider.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {rider.jobTitle ?? rider.department ?? ""}
              {rider.company ? ` · ${rider.company.name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-xs font-semibold bg-muted px-2 py-0.5 rounded-full">
            {request.seatsNeeded} seat{request.seatsNeeded !== 1 ? "s" : ""}
          </span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_BADGE[request.status] ?? ""}`}>
            {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {(request.pickupPoint || request.dropoffPoint || request.paymentMode) && (
        <div className="space-y-1">
          {request.pickupPoint && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-violet-500 shrink-0" />
              <span>Pickup: {request.pickupPoint}</span>
            </div>
          )}
          {request.dropoffPoint && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-cyan-500 shrink-0" />
              <span>Drop-off: {request.dropoffPoint}</span>
            </div>
          )}
          {request.paymentMode && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-3 w-3 text-blue-400 shrink-0 font-bold text-[10px]">₹</span>
              <span>Payment: {request.paymentMode === "MONTHLY" ? "Monthly pass" : request.paymentMode === "UPI" ? "UPI" : "Cash"}</span>
            </div>
          )}
        </div>
      )}

      {request.message && (
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 italic">"{request.message}"</p>
      )}

      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" /> {formatRelativeTime(request.createdAt)}
      </p>

      {isPending && (
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
          <Button size="sm" className="gap-1.5 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => act("APPROVE")} disabled={!!loading}>
            {loading === "APPROVE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            Approve
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50"
            onClick={() => act("DECLINE")} disabled={!!loading}>
            {loading === "DECLINE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Decline
          </Button>
        </div>
      )}
    </div>
  )
}

export function CarpoolRidersPanel({ routeId, initialCount, fromLat, fromLng, toLat, toLng, stops = [] }: Props) {
  const [open,         setOpen]        = useState(false)
  const [requests,     setRequests]    = useState<CarpoolRequest[]>([])
  const [loadingPanel, setLoading]     = useState(false)
  const [count,        setCount]       = useState(initialCount)

  const hasMap = !!(fromLat && fromLng && toLat && toLng)

  async function load() {
    if (requests.length > 0) { setOpen(true); return }
    setLoading(true)
    try {
      const res  = await fetch(`/api/carpool/${routeId}/requests`)
      const data = await res.json()
      setRequests(data.requests ?? [])
      setCount((data.requests ?? []).length)
      setOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const pending  = requests.filter((r) => r.status === "PENDING")
  const approved = requests.filter((r) => r.status === "APPROVED")
  const resolved = requests.filter((r) => ["DECLINED", "CANCELLED"].includes(r.status))
  const pendingCount = pending.length

  // Build rider points for the owner map (all requests that have coordinates)
  const riderPoints: RiderPoint[] = requests
    .filter((r) => r.status === "APPROVED" || r.status === "PENDING")
    .map((r) => ({
      name:       r.user.name ?? "Rider",
      pickupLat:  r.pickupLat,
      pickupLng:  r.pickupLng,
      dropoffLat: r.dropoffLat,
      dropoffLng: r.dropoffLng,
    }))
    .filter((r) => r.pickupLat || r.dropoffLat)

  return (
    <div className="pt-4 border-t border-border">
      <button
        onClick={() => (open ? setOpen(false) : load())}
        className="flex items-center justify-between w-full text-sm font-semibold hover:text-foreground transition-colors">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary-600" />
          Seat Requests
          {count > 0 && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              pendingCount > 0
                ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                : "bg-muted text-muted-foreground"
            }`}>
              {count}
            </span>
          )}
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {loadingPanel && (
        <div className="mt-3 flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {open && !loadingPanel && (
        <div className="mt-3 space-y-5">
          {requests.length === 0 ? (
            <div className="text-center py-6">
              <Car className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No seat requests yet</p>
            </div>
          ) : (
            <>
              {pending.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Pending ({pending.length})</p>
                  <div className="space-y-3">{pending.map((r) => <RiderCard key={r.id} request={r} routeId={routeId} />)}</div>
                </div>
              )}
              {approved.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Approved Riders ({approved.length})</p>
                  <div className="space-y-3">{approved.map((r) => <RiderCard key={r.id} request={r} routeId={routeId} />)}</div>
                </div>
              )}
              {resolved.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Resolved ({resolved.length})</p>
                  <div className="space-y-3">{resolved.map((r) => <RiderCard key={r.id} request={r} routeId={routeId} />)}</div>
                </div>
              )}

              {/* Route + rider map */}
              {hasMap && riderPoints.length > 0 && (
                <CarpoolOwnerMap
                  fromLat={fromLat!}
                  fromLng={fromLng!}
                  toLat={toLat!}
                  toLng={toLng!}
                  stops={stops}
                  riders={riderPoints}
                />
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
