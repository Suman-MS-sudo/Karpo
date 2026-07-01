import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import loadDynamic from "next/dynamic"
import {
  ArrowLeft, ArrowRight, Clock, Users, Car, MapPin, Repeat,
  CheckCircle2, Volume2, VolumeX, Luggage, Wind, Calendar,
  CreditCard, Shield, RotateCcw, ChevronDown,
} from "lucide-react"
import { SocialShare } from "@/components/shared/SocialShare"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCard } from "@/components/shared/UserCard"
import { formatCurrency } from "@/lib/utils"
import { CarpoolRequestPanel } from "@/components/carpool/CarpoolRequestPanel"
import { CarpoolRidersPanel } from "@/components/carpool/CarpoolRidersPanel"
import { CarpoolRideControls } from "@/components/carpool/CarpoolRideControls"
import { CarpoolLiveTrack } from "@/components/carpool/CarpoolLiveTrack"

export const dynamic = "force-dynamic"

const CarpoolRouteMap = loadDynamic(
  () => import("@/components/carpool/CarpoolRouteMap").then((m) => m.CarpoolRouteMap),
  { ssr: false, loading: () => <div className="h-[220px] rounded-xl bg-muted animate-pulse" /> }
)

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY:    "Every day",
  WEEKDAYS: "Mon – Fri",
  WEEKENDS: "Sat – Sun",
  WEEKLY:   "Weekly",
  ONCE:     "One-time",
}
const MUSIC_LABELS: Record<string, string> = {
  ANY:      "Music OK",
  LIGHT:    "Soft music",
  NO_MUSIC: "Silent ride",
}
const LUGGAGE_LABELS: Record<string, string> = {
  ANY:        "Any luggage",
  SMALL:      "Small bags only",
  NO_LUGGAGE: "No extra luggage",
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

  const approvedRiders = isOwner && route.fromLat && route.toLat
    ? await prisma.carpoolRequest.findMany({
        where:  { routeId: params.id, status: "APPROVED" },
        select: { id: true, userId: true, pickupLat: true, pickupLng: true, pickupPoint: true, dropoffLat: true, dropoffLng: true, dropoffPoint: true, seatsNeeded: true, user: { select: { name: true } } },
      })
    : []

  const riderMarks: Array<{ lat: number; lng: number; label: string; type: "pickup" | "dropoff"; name: string }> = []
  for (const rider of approvedRiders) {
    if (rider.pickupLat && rider.pickupLng)
      riderMarks.push({ lat: rider.pickupLat, lng: rider.pickupLng, label: rider.user?.name?.split(" ")[0] ?? "Rider", type: "pickup", name: rider.pickupPoint ?? "" })
    if (rider.dropoffLat && rider.dropoffLng)
      riderMarks.push({ lat: rider.dropoffLat, lng: rider.dropoffLng, label: rider.user?.name?.split(" ")[0] ?? "Rider", type: "dropoff", name: rider.dropoffPoint ?? "" })
  }

  const hasMapData    = !!(route.fromLat && route.fromLng && route.toLat && route.toLng)
  const stopCoords    = (route.stopCoords as any as Array<{ name: string; lat: number; lng: number }>) || []
  const freqLabel     = FREQUENCY_LABELS[route.frequency] ?? route.frequency
  const tripsPerMonth = route.frequency === "WEEKDAYS" ? 22 : route.frequency === "DAILY" ? 30 : route.frequency === "WEEKENDS" ? 8 : route.frequency === "WEEKLY" ? 4 : 1
  const monthlyCost   = route.monthlyPassAvailable && route.monthlyPassPrice
    ? route.monthlyPassPrice
    : route.pricePerSeat * tripsPerMonth

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link href="/carpool" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground mb-5 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Carpool
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Left column ───────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Route header — from / to + quick pills */}
          <div className="bg-card border border-border border-l-4 border-l-orange-400 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-base truncate max-w-[180px]">{route.fromLocation}</span>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="font-semibold text-base truncate max-w-[180px]">{route.toLocation}</span>
                </div>
              </div>
              <SocialShare
                title={`Carpool: ${route.fromLocation} → ${route.toLocation} on Korpo`}
                path={`/carpool/${params.id}`}
                variant="icon"
              />
            </div>

            {/* Quick-stat pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                <Clock className="h-3 w-3" /> {route.departureTime}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                seatsLeft === 0 ? "bg-red-100 dark:bg-red-950/30 text-red-600" : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
              }`}>
                <Users className="h-3 w-3" /> {seatsLeft}/{route.seatsAvailable} seats
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                <Car className="h-3 w-3" /> {route.vehicleType}
              </span>
              <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                <Repeat className="h-3 w-3" /> {freqLabel}
              </span>
              {route.acAvailable && (
                <span className="inline-flex items-center gap-1 text-xs bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-full font-medium">
                  <Wind className="h-3 w-3" /> AC
                </span>
              )}
              {route.vehicleNumber && (
                <span className="text-xs font-mono bg-muted px-2.5 py-1 rounded-full text-muted-foreground">
                  {route.vehicleNumber}
                </span>
              )}
            </div>

            {/* Intermediate stops */}
            {stopCoords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Stops along the route</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-emerald-600 font-medium">{route.fromLocation}</span>
                  {stopCoords.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ArrowRight className="h-3 w-3" /> {s.name}
                    </span>
                  ))}
                  <span className="flex items-center gap-1 text-xs text-red-500 font-medium">
                    <ArrowRight className="h-3 w-3" /> {route.toLocation}
                  </span>
                </div>
              </div>
            )}

            {route.landmarks && (
              <p className="mt-2 text-xs text-muted-foreground">Via: {route.landmarks}</p>
            )}
          </div>

          {/* Map */}
          {hasMapData && (
            <div className="bg-card border border-border rounded-2xl overflow-hidden" style={{ isolation: "isolate", zIndex: 0 }}>
              <CarpoolRouteMap
                fromLat={route.fromLat!}
                fromLng={route.fromLng!}
                fromLocation={route.fromLocation}
                toLat={route.toLat!}
                toLng={route.toLng!}
                toLocation={route.toLocation}
                stops={stopCoords}
                riderMarks={isOwner ? riderMarks : undefined}
                height={220}
              />
              <div className="px-4 py-2.5 border-t border-border flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Origin</span>
                {stopCoords.length > 0 && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-400" />Stops</span>}
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" />Destination</span>
                <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-blue-500 rounded" />Route</span>
                {isOwner && riderMarks.length > 0 && <>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-500" />Rider pickups</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500" />Drop-offs</span>
                </>}
              </div>
            </div>
          )}

          {/* Preferences + pricing — compact combined card */}
          <div className="bg-card border border-border rounded-2xl divide-y divide-border">

            {/* Preferences row */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Ride Details</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                {route.musicPolicy && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {route.musicPolicy === "NO_MUSIC"
                      ? <VolumeX className="h-3.5 w-3.5 shrink-0" />
                      : <Volume2 className="h-3.5 w-3.5 shrink-0" />}
                    <span>{MUSIC_LABELS[route.musicPolicy] ?? route.musicPolicy}</span>
                  </div>
                )}
                {route.luggagePolicy && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Luggage className="h-3.5 w-3.5 shrink-0" />
                    <span>{LUGGAGE_LABELS[route.luggagePolicy] ?? route.luggagePolicy}</span>
                  </div>
                )}
                {route.vehicleModel && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Car className="h-3.5 w-3.5 shrink-0" />
                    <span>{route.vehicleModel}</span>
                  </div>
                )}
                {route.returnTrip && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                    <span>Return at {route.returnTime ?? "available"}</span>
                  </div>
                )}
                {route.allowedGender && route.allowedGender !== "NO_PREFERENCE" && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-3.5 w-3.5 shrink-0" />
                    <span>{route.allowedGender === "FEMALE" ? "Women only" : "Men only"}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pricing row */}
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Cost</p>
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <p className="text-2xl font-bold text-primary-600">{formatCurrency(route.pricePerSeat)}</p>
                  <p className="text-xs text-muted-foreground">per seat · per trip</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>~{formatCurrency(route.pricePerSeat * Math.round(tripsPerMonth / 4))}<span className="text-xs">/week</span></p>
                  <p>~{formatCurrency(monthlyCost)}<span className="text-xs">/month</span>
                    {route.monthlyPassAvailable && <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">(pass available)</span>}
                  </p>
                </div>
                {isOwner && approvedRiders.length > 0 && (
                  <div className="text-sm">
                    <p className="text-xs text-muted-foreground">Your monthly revenue</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(approvedRiders.reduce((a, r) => a + r.seatsNeeded, 0) * route.pricePerSeat * tripsPerMonth)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {route.notes && (
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <p className="text-sm text-muted-foreground">{route.notes}</p>
              </div>
            )}
          </div>

          {/* Safety tips — collapsible */}
          <details className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl group">
            <summary className="flex items-center justify-between px-5 py-3.5 cursor-pointer list-none text-sm font-semibold text-blue-800 dark:text-blue-300 select-none">
              <span className="flex items-center gap-2"><Shield className="h-4 w-4" /> Safety Tips</span>
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-4">
              <ul className="space-y-1.5 text-sm text-blue-700 dark:text-blue-400">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />Verify the driver's identity and vehicle plate before boarding</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />Share your trip details with someone you trust</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />Confirm pickup time and exact spot via messages beforehand</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />Settle payment as agreed — UPI or cash as preferred by driver</li>
              </ul>
            </div>
          </details>
        </div>

        {/* ── Sidebar ──────────────────────────────────── */}
        <div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden sticky top-4">

            {/* Price hero */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="text-3xl font-bold text-primary-600">{formatCurrency(route.pricePerSeat)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">per seat · per trip</p>
                </div>
                {seatsLeft > 0
                  ? <Badge variant="success" className="shrink-0">{seatsLeft} seat{seatsLeft !== 1 ? "s" : ""} free</Badge>
                  : <Badge variant="destructive" className="shrink-0">Full</Badge>}
              </div>
              {route.monthlyPassAvailable && route.monthlyPassPrice && (
                <div className="bg-white/60 dark:bg-black/20 rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  Monthly pass: {formatCurrency(route.monthlyPassPrice)}/mo
                </div>
              )}
            </div>

            {/* Key details */}
            <div className="px-5 py-4 space-y-2.5 border-b border-border">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />Departs</span>
                <span className="font-semibold">{route.departureTime}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Runs</span>
                <span className="font-semibold">{freqLabel}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Car className="h-3.5 w-3.5" />Vehicle</span>
                <span className="font-semibold">{route.vehicleType}{route.acAvailable ? " · AC" : ""}</span>
              </div>
              {route.vehicleNumber && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Plate</span>
                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-semibold">{route.vehicleNumber}</span>
                </div>
              )}
              {route.returnTrip && route.returnTime && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1.5"><RotateCcw className="h-3.5 w-3.5" />Returns</span>
                  <span className="font-semibold">{route.returnTime}</span>
                </div>
              )}
            </div>

            {/* Driver */}
            <div className="px-5 py-4 border-b border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Driver</p>
              <UserCard user={route.user} size="md" />
            </div>

            {/* CTA */}
            <div className="px-5 py-4">
              {isOwner ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="h-9 text-xs">Edit route</Button>
                    <Button variant="outline" size="sm" className="h-9 text-xs border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50">Deactivate</Button>
                  </div>
                  <CarpoolRideControls routeId={route.id} initialStatus={route.rideStatus ?? "IDLE"} />
                  <CarpoolRidersPanel
                    routeId={route.id}
                    initialCount={route._count.requests}
                    fromLat={route.fromLat ?? undefined}
                    fromLng={route.fromLng ?? undefined}
                    toLat={route.toLat ?? undefined}
                    toLng={route.toLng ?? undefined}
                    stops={stopCoords}
                  />
                </div>
              ) : (
                <div className="space-y-4">
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
                  {myRequest?.status === "APPROVED" && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Live Tracking</p>
                      <CarpoolLiveTrack
                        routeId={route.id}
                        pickupLat={myRequest.pickupLat ?? undefined}
                        pickupLng={myRequest.pickupLng ?? undefined}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
