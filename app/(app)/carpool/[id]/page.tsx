import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import loadDynamic from "next/dynamic"
import {
  ArrowLeft, ArrowRight, Clock, Users, Car, MapPin, Repeat,
  CheckCircle2, Volume2, VolumeX, Luggage, Wind, Calendar,
  CreditCard, Shield, TrendingDown, RotateCcw, Palette,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCard } from "@/components/shared/UserCard"
import { formatCurrency } from "@/lib/utils"
import { CarpoolRequestPanel } from "@/components/carpool/CarpoolRequestPanel"
import { CarpoolRidersPanel } from "@/components/carpool/CarpoolRidersPanel"
import { CarpoolRideControls } from "@/components/carpool/CarpoolRideControls"
import { CarpoolLiveTrack } from "@/components/carpool/CarpoolLiveTrack"

export const dynamic = "force-dynamic"

// Dynamic map imports — SSR disabled (Leaflet requires browser APIs)
const CarpoolRouteMap = loadDynamic(
  () => import("@/components/carpool/CarpoolRouteMap").then((m) => m.CarpoolRouteMap),
  { ssr: false, loading: () => <div className="h-[300px] rounded-2xl bg-muted animate-pulse border border-border" /> }
)

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY:    "Every day",
  WEEKDAYS: "Mon – Fri",
  WEEKENDS: "Sat – Sun",
  WEEKLY:   "Once a week",
  ONCE:     "One-time trip",
}

const MUSIC_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  ANY:      { label: "Music OK",    icon: Volume2, color: "text-emerald-600" },
  LIGHT:    { label: "Soft music",  icon: Volume2, color: "text-blue-600" },
  NO_MUSIC: { label: "Silent ride", icon: VolumeX, color: "text-slate-500" },
}
const LUGGAGE_LABELS: Record<string, string> = {
  ANY:        "Any luggage OK",
  SMALL:      "Small bags only",
  NO_LUGGAGE: "No extra luggage",
}
const GENDER_LABELS: Record<string, string> = {
  NO_PREFERENCE: "No preference",
  MALE:          "Male riders only",
  FEMALE:        "Female riders only",
}

export default async function CarpoolDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  const route = await prisma.carpoolRoute.findUnique({
    where: { id: params.id },
    include: {
      user:   { include: { company: { select: { name: true, logo: true, domain: true } } } },
      _count: { select: { requests: true } },
    },
  })


  if (!route || !route.isActive) notFound()

  const isOwner = session?.user?.id === route.userId

  const approvedSeats = await prisma.carpoolRequest.aggregate({
    where: { routeId: params.id, status: "APPROVED" },
    _sum:  { seatsNeeded: true },
  })
  const seatsLeft = Math.max(0, route.seatsAvailable - (approvedSeats._sum.seatsNeeded ?? 0))

  const myRequest = session?.user?.id && !isOwner
    ? await prisma.carpoolRequest.findUnique({
        where:  { routeId_userId: { routeId: params.id, userId: session.user.id } },
        select: {
          id: true, status: true, pickupPoint: true, seatsNeeded: true, paymentMode: true,
          pickupLat: true, pickupLng: true, dropoffLat: true, dropoffLng: true, dropoffPoint: true,
        },
      })
    : null

  // For owner: load approved rider pickup/dropoff marks for the map
  const approvedRiders = isOwner && route.fromLat && route.toLat
    ? await prisma.carpoolRequest.findMany({
        where:  { routeId: params.id, status: "APPROVED" },
        select: { id: true, userId: true, pickupLat: true, pickupLng: true, pickupPoint: true, dropoffLat: true, dropoffLng: true, dropoffPoint: true, seatsNeeded: true, user: { select: { name: true } } },
      })
    : []

  // Build rider marks for the map
  const riderMarks: Array<{ lat: number; lng: number; label: string; type: "pickup" | "dropoff"; name: string }> = []
  for (const rider of approvedRiders) {
    if (rider.pickupLat && rider.pickupLng) {
      riderMarks.push({ lat: rider.pickupLat, lng: rider.pickupLng, label: rider.user?.name?.split(" ")[0] ?? "Rider", type: "pickup", name: rider.pickupPoint ?? "" })
    }
    if (rider.dropoffLat && rider.dropoffLng) {
      riderMarks.push({ lat: rider.dropoffLat, lng: rider.dropoffLng, label: rider.user?.name?.split(" ")[0] ?? "Rider", type: "dropoff", name: rider.dropoffPoint ?? "" })
    }
  }

  const hasMapData = !!(route.fromLat && route.fromLng && route.toLat && route.toLng)
  const stopCoords = (route.stopCoords as any as Array<{ name: string; lat: number; lng: number }>) || []

  const frequencyLabel = FREQUENCY_LABELS[route.frequency] ?? route.frequency

  const tripsPerMonth = route.frequency === "WEEKDAYS" ? 22 : route.frequency === "DAILY" ? 30 : route.frequency === "WEEKENDS" ? 8 : route.frequency === "WEEKLY" ? 4 : 1
  const monthlyCost   = route.monthlyPassAvailable && route.monthlyPassPrice ? route.monthlyPassPrice : route.pricePerSeat * tripsPerMonth

  const musicMeta = route.musicPolicy ? MUSIC_LABELS[route.musicPolicy] : null
  const MusicIcon = musicMeta?.icon

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/carpool" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Carpool
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Main ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Route hero */}
          <div className="bg-card border border-border border-l-4 border-l-orange-400 rounded-2xl p-6">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">From</p>
                  <p className="font-bold text-lg leading-tight">{route.fromLocation}</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">To</p>
                  <p className="font-bold text-lg leading-tight">{route.toLocation}</p>
                </div>
              </div>
            </div>

            {/* Intermediate stops as chain */}
            {stopCoords.length > 0 && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Pickup stops along the route</p>
                <div className="flex items-start gap-2">
                  <div className="flex flex-col items-center gap-1 mt-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    {stopCoords.map((_, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="h-4 w-px bg-border" />
                        <div className="h-2 w-2 rounded-full bg-orange-400" />
                      </div>
                    ))}
                    <div className="h-4 w-px bg-border" />
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                  </div>
                  <div className="space-y-2 flex-1">
                    <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{route.fromLocation}</p>
                    {stopCoords.map((s, i) => (
                      <p key={i} className="text-xs text-muted-foreground">
                        <span className="inline-block w-4 text-orange-500 font-bold">{i + 1}.</span> {s.name}
                      </p>
                    ))}
                    <p className="text-xs font-medium text-red-500">{route.toLocation}</p>
                  </div>
                </div>
              </div>
            )}

            {route.landmarks && (
              <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                Passes through: {route.landmarks}
              </p>
            )}
          </div>

          {/* Interactive route map */}
          {hasMapData && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center justify-between">
                <h2 className="font-semibold text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />Route Map
                </h2>
                {isOwner && riderMarks.length > 0 && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" />Rider pickups ({approvedRiders.filter(r => r.pickupLat).length})</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500" />Drop-offs ({approvedRiders.filter(r => r.dropoffLat).length})</span>
                  </div>
                )}
              </div>
              <div className="px-5 pb-5">
                <CarpoolRouteMap
                  fromLat={route.fromLat!}
                  fromLng={route.fromLng!}
                  fromLocation={route.fromLocation}
                  toLat={route.toLat!}
                  toLng={route.toLng!}
                  toLocation={route.toLocation}
                  stops={stopCoords}
                  riderMarks={isOwner ? riderMarks : undefined}
                  height={300}
                />
                <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Origin</span>
                  {stopCoords.length > 0 && <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-orange-400" />Stops</span>}
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Destination</span>
                  <span className="flex items-center gap-1.5"><span className="h-1 w-4 bg-blue-500 rounded" />Route</span>
                </div>
              </div>
            </div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Clock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Departs</p>
              <p className="font-bold text-sm">{route.departureTime}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Seats</p>
              <p className={`font-bold text-sm ${seatsLeft === 0 ? "text-red-500" : "text-emerald-600 dark:text-emerald-400"}`}>
                {seatsLeft} / {route.seatsAvailable}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Car className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Vehicle</p>
              <p className="font-bold text-sm">{route.vehicleType}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <Repeat className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
              <p className="text-xs text-muted-foreground">Runs</p>
              <p className="font-bold text-sm">{frequencyLabel}</p>
            </div>
          </div>

          {/* Return trip */}
          {route.returnTrip && (
            <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                <RotateCcw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Return trip available</p>
                {route.returnTime && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Returns from {route.toLocation} at {route.returnTime}
                  </p>
                )}
              </div>
              {route.returnTime && (
                <Badge variant="outline" className="ml-auto">{route.returnTime}</Badge>
              )}
            </div>
          )}

          {/* Vehicle & preferences */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Vehicle photo */}
            {route.vehiclePhoto && (
              <div className="relative aspect-video max-h-64 bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={route.vehiclePhoto} alt="Vehicle" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  {route.vehicleColor && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-white bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      <span className="h-3 w-3 rounded-full border border-white/40" style={{ background: route.vehicleColor.toLowerCase() }} />
                      {route.vehicleColor}
                    </span>
                  )}
                  {route.vehicleModel && (
                    <span className="text-xs font-semibold text-white bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {route.vehicleModel}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="p-5">
              <h2 className="font-semibold text-sm mb-4">Vehicle & Ride Preferences</h2>

              {/* Identity row (model + color) — shown even without photo */}
              {(route.vehicleModel || route.vehicleColor) && !route.vehiclePhoto && (
                <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-border">
                  {route.vehicleModel && (
                    <div className="flex items-center gap-2.5">
                      <Car className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Model</p>
                        <p className="text-sm font-semibold">{route.vehicleModel}</p>
                      </div>
                    </div>
                  )}
                  {route.vehicleColor && (
                    <div className="flex items-center gap-2.5">
                      <Palette className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Color</p>
                        <div className="flex items-center gap-1.5">
                          <span className="h-4 w-4 rounded-full border border-border shadow-sm" style={{ background: route.vehicleColor.toLowerCase() }} />
                          <p className="text-sm font-semibold">{route.vehicleColor}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5">
                  <Wind className={`h-4 w-4 shrink-0 ${route.acAvailable ? "text-blue-500" : "text-muted-foreground"}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Air Conditioning</p>
                    <p className="text-sm font-medium">{route.acAvailable ? "AC available" : "Non-AC"}</p>
                  </div>
                </div>
                {route.vehicleNumber && (
                  <div className="flex items-center gap-2.5">
                    <Car className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Vehicle No.</p>
                      <p className="text-sm font-mono font-semibold">{route.vehicleNumber}</p>
                    </div>
                  </div>
                )}
                {musicMeta && (
                  <div className="flex items-center gap-2.5">
                    {MusicIcon && <MusicIcon className={`h-4 w-4 shrink-0 ${musicMeta.color}`} />}
                    <div>
                      <p className="text-xs text-muted-foreground">Music policy</p>
                      <p className="text-sm font-medium">{musicMeta.label}</p>
                    </div>
                  </div>
                )}
                {route.luggagePolicy && (
                  <div className="flex items-center gap-2.5">
                    <Luggage className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Luggage</p>
                      <p className="text-sm font-medium">{LUGGAGE_LABELS[route.luggagePolicy] ?? route.luggagePolicy}</p>
                    </div>
                  </div>
                )}
                {route.allowedGender && route.allowedGender !== "NO_PREFERENCE" && (
                  <div className="flex items-center gap-2.5">
                    <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Rider preference</p>
                      <p className="text-sm font-medium">{GENDER_LABELS[route.allowedGender] ?? route.allowedGender}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cost breakdown */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-emerald-500" />Transparent Cost Breakdown
            </h2>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Per trip</p>
                <p className="font-bold text-base">{formatCurrency(route.pricePerSeat)}</p>
                <p className="text-[10px] text-muted-foreground">per seat</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Per week</p>
                <p className="font-bold text-base">{formatCurrency(route.pricePerSeat * Math.round(tripsPerMonth / 4))}</p>
                <p className="text-[10px] text-muted-foreground">est.</p>
              </div>
              <div className={`rounded-xl p-3 text-center ${route.monthlyPassAvailable ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800" : "bg-muted/50"}`}>
                <p className="text-xs text-muted-foreground mb-0.5">Per month</p>
                <p className={`font-bold text-base ${route.monthlyPassAvailable ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                  {formatCurrency(monthlyCost)}
                </p>
                {route.monthlyPassAvailable && <p className="text-[10px] text-emerald-600 dark:text-emerald-400">monthly pass</p>}
              </div>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground bg-muted/30 rounded-xl p-3">
              <p className="font-medium text-foreground text-xs mb-2">How pricing works</p>
              <p className="flex justify-between"><span>Base price per trip</span><span className="font-medium text-foreground">{formatCurrency(route.pricePerSeat)}/seat</span></p>
              <p className="flex justify-between"><span>Frequency</span><span className="font-medium text-foreground">{frequencyLabel} (~{tripsPerMonth} trips/month)</span></p>
              {route.monthlyPassAvailable && route.monthlyPassPrice && (
                <>
                  <div className="border-t border-border my-2" />
                  <p className="flex justify-between"><span>Pay-per-trip monthly cost</span><span>{formatCurrency(route.pricePerSeat * tripsPerMonth)}</span></p>
                  <p className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium"><span>Monthly pass</span><span>{formatCurrency(route.monthlyPassPrice)} (save {formatCurrency(route.pricePerSeat * tripsPerMonth - route.monthlyPassPrice)})</span></p>
                </>
              )}
              {isOwner && (
                <>
                  <div className="border-t border-border my-2" />
                  <p className="font-medium text-foreground text-xs mb-1">Driver revenue estimate</p>
                  <p className="flex justify-between"><span>At {approvedRiders.reduce((a, r) => a + r.seatsNeeded, 0)} approved seat(s)</span>
                    <span className="font-medium text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(approvedRiders.reduce((a, r) => a + r.seatsNeeded, 0) * route.pricePerSeat * tripsPerMonth)}/month
                    </span>
                  </p>
                  <p className="flex justify-between"><span>At full capacity ({route.seatsAvailable} seats)</span>
                    <span className="font-medium">{formatCurrency(route.seatsAvailable * route.pricePerSeat * tripsPerMonth)}/month</span>
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {route.notes && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold text-sm mb-2">Additional Notes</h2>
              <p className="text-sm text-muted-foreground">{route.notes}</p>
            </div>
          )}

          {/* Safety tips */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-5">
            <p className="font-semibold text-blue-800 dark:text-blue-300 mb-3 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />Carpool Safety Tips
            </p>
            <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-400">
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />Verify the driver's identity and vehicle plate before boarding</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />Share your trip details with someone you trust</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />Confirm pickup time and exact spot via messages beforehand</li>
              <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />Settle payment as agreed — UPI or cash as preferred by driver</li>
            </ul>
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-5 sticky top-4">
            {/* Price */}
            <div className="text-center pb-4 border-b border-border">
              <p className="text-3xl font-bold text-primary-600">{formatCurrency(route.pricePerSeat)}</p>
              <p className="text-sm text-muted-foreground mt-0.5">per seat · per trip</p>
              {route.monthlyPassAvailable && route.monthlyPassPrice && (
                <div className="mt-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold flex items-center justify-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Monthly pass: {formatCurrency(route.monthlyPassPrice)}
                  </p>
                </div>
              )}
              <div className="mt-3">
                {seatsLeft > 0
                  ? <Badge variant="success"><Users className="h-3 w-3 mr-1" />{seatsLeft} of {route.seatsAvailable} seats free</Badge>
                  : <Badge variant="destructive">Route full</Badge>}
              </div>
            </div>

            {/* Schedule summary */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Departs</span>
                <span className="font-semibold">{route.departureTime}</span>
              </div>
              {route.returnTrip && route.returnTime && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" />Returns</span>
                  <span className="font-semibold">{route.returnTime}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Runs</span>
                <span className="font-semibold">{frequencyLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Wind className="h-3.5 w-3.5" />AC</span>
                <span className="font-semibold">{route.acAvailable ? "Yes" : "No"}</span>
              </div>
              {route.vehicleModel && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Car className="h-3.5 w-3.5" />Model</span>
                  <span className="font-semibold text-xs">{route.vehicleModel}</span>
                </div>
              )}
              {route.vehicleColor && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Palette className="h-3.5 w-3.5" />Color</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold">
                    <span className="h-3.5 w-3.5 rounded-full border border-border shadow-sm" style={{ background: route.vehicleColor.toLowerCase() }} />
                    {route.vehicleColor}
                  </span>
                </div>
              )}
              {route.vehicleNumber && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Plate</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold">{route.vehicleNumber}</span>
                </div>
              )}
            </div>

            {/* Driver */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Driver</p>
              <UserCard user={route.user} size="md" />
            </div>

            {/* CTA */}
            <div className="pt-3 border-t border-border">
              {isOwner ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button variant="outline" size="sm" className="text-xs h-8">Edit</Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50">
                      Deactivate
                    </Button>
                  </div>

                  {/* Start Ride / GPS broadcast */}
                  <div className="mb-4">
                    <CarpoolRideControls
                      routeId={route.id}
                      initialStatus={route.rideStatus ?? "IDLE"}
                    />
                  </div>

                  <CarpoolRidersPanel
                    routeId={route.id}
                    initialCount={route._count.requests}
                    fromLat={route.fromLat ?? undefined}
                    fromLng={route.fromLng ?? undefined}
                    toLat={route.toLat ?? undefined}
                    toLng={route.toLng ?? undefined}
                    stops={stopCoords}
                  />
                </>
              ) : (
                <>
                  <CarpoolRequestPanel
                    routeId={route.id}
                    myRequest={myRequest as any}
                    driverName={route.user.name ?? "Driver"}
                    seatsLeft={seatsLeft}
                    pickupPoints={route.pickupPoints}
                    monthlyPassAvailable={route.monthlyPassAvailable}
                    monthlyPassPrice={route.monthlyPassPrice}
                    pricePerSeat={route.pricePerSeat}
                    fromLat={route.fromLat ?? undefined}
                    fromLng={route.fromLng ?? undefined}
                    toLat={route.toLat ?? undefined}
                    toLng={route.toLng ?? undefined}
                    routeStops={stopCoords}
                  />

                  {/* Live ride tracking for approved riders */}
                  {myRequest?.status === "APPROVED" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live ride tracking</p>
                      <CarpoolLiveTrack
                        routeId={route.id}
                        pickupLat={myRequest.pickupLat ?? undefined}
                        pickupLng={myRequest.pickupLng ?? undefined}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
