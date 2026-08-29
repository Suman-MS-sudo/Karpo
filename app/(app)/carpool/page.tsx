import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { Suspense } from "react"
import { Plus, ArrowRight, Search, Zap, Car } from "lucide-react"
import { PageHero } from "@/components/shared/PageHero"
import { CategoryStrip } from "@/components/shared/CategoryStrip"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { UserCard } from "@/components/shared/UserCard"
import { PremiumBadge, PremiumStrip } from "@/components/shared/PremiumBadge"
import { CarpoolSearchBar } from "@/components/carpool/CarpoolSearchBar"
import { formatCurrency, formatDate } from "@/lib/utils"
import { FREE_LIMITS } from "@/lib/limits"
import { expireOneTimeCarpoolRoutes } from "@/lib/carpool"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Carpool",
  description: "Find or offer a daily commute carpool with verified colleagues in your city and split the cost of your ride.",
}

// ── Geo helpers (server-side) ─────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R    = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a    = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function distAndT(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number,
): { distKm: number; t: number } {
  const dx = bLng - aLng, dy = bLat - aLat
  const lenSq = dx * dx + dy * dy
  const t     = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / lenSq))
  return { distKm: haversineKm(pLat, pLng, aLat + t * dy, aLng + t * dx), t }
}

interface RouteRecord {
  fromLat:      number | null
  fromLng:      number | null
  toLat:        number | null
  toLng:        number | null
  stopCoords:   unknown
  departureTime: string
}

function routeMatchesSearch(
  route: RouteRecord,
  pickupLat: number, pickupLng: number,
  dropoffLat: number, dropoffLng: number,
  thresholdKm = 5,
): boolean {
  if (!route.fromLat || !route.fromLng || !route.toLat || !route.toLng) return false

  const rawStops = (route.stopCoords as Array<{ lat: number; lng: number }>) ?? []
  const waypoints = [
    { lat: route.fromLat, lng: route.fromLng },
    ...rawStops,
    { lat: route.toLat,   lng: route.toLng },
  ]

  let pickupBestDist  = Infinity, pickupBestPos  = Infinity
  let dropoffBestDist = Infinity, dropoffBestPos = Infinity
  let cumulativeLen   = 0

  for (let i = 0; i < waypoints.length - 1; i++) {
    const { lat: aLat, lng: aLng } = waypoints[i]
    const { lat: bLat, lng: bLng } = waypoints[i + 1]
    const segLen = haversineKm(aLat, aLng, bLat, bLng)

    const pu = distAndT(pickupLat,  pickupLng,  aLat, aLng, bLat, bLng)
    const dr = distAndT(dropoffLat, dropoffLng, aLat, aLng, bLat, bLng)

    if (pu.distKm < pickupBestDist)  { pickupBestDist  = pu.distKm;  pickupBestPos  = cumulativeLen + pu.t * segLen }
    if (dr.distKm < dropoffBestDist) { dropoffBestDist = dr.distKm;  dropoffBestPos = cumulativeLen + dr.t * segLen }

    cumulativeLen += segLen
  }

  return (
    pickupBestDist  <= thresholdKm &&
    dropoffBestDist <= thresholdKm &&
    pickupBestPos   <  dropoffBestPos
  )
}

function matchesTimeFilter(departureTime: string, timeOfDay: string): boolean {
  if (!timeOfDay) return true
  const h = parseInt(departureTime.split(":")[0])
  if (timeOfDay === "morning")   return h >= 5  && h < 12
  if (timeOfDay === "afternoon") return h >= 12 && h < 17
  if (timeOfDay === "evening")   return h >= 17 && h < 22
  return true
}

// ── Labels ────────────────────────────────────────────────────────────────────

const FREQ_LABEL: Record<string, string> = {
  DAILY:    "Daily",
  WEEKDAYS: "Mon–Fri",
  WEEKENDS: "Sat–Sun",
  WEEKLY:   "Weekly",
  ONCE:     "One-time",
}

const FREQ_COLORS: Record<string, string> = {
  DAILY:    "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
  WEEKDAYS: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  ONCE:     "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800",
}

const FREQ_ICONS: Record<string, string> = {
  DAILY: "Repeat", WEEKDAYS: "Briefcase", WEEKENDS: "Home", WEEKLY: "Calendar", ONCE: "Clock",
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CarpoolPage({
  searchParams,
}: {
  searchParams: {
    from?: string; fromLat?: string; fromLng?: string
    to?: string;   toLat?: string;   toLng?: string
    time?: string; freq?: string; vehicle?: string; ac?: string; maxPrice?: string
  }
}) {
  // Location params
  const pickupLat  = searchParams.fromLat ? parseFloat(searchParams.fromLat) : null
  const pickupLng  = searchParams.fromLng ? parseFloat(searchParams.fromLng) : null
  const dropoffLat = searchParams.toLat   ? parseFloat(searchParams.toLat)   : null
  const dropoffLng = searchParams.toLng   ? parseFloat(searchParams.toLng)   : null
  const isSearching = !!(pickupLat && pickupLng && dropoffLat && dropoffLng)

  // Filter params
  const timeOfDay     = searchParams.time ?? ""
  const freqFilter    = searchParams.freq?.split(",").filter(Boolean) ?? []
  const vehicleFilter = searchParams.vehicle?.split(",").filter(Boolean) ?? []
  const acOnly        = searchParams.ac === "1"
  const maxPrice      = searchParams.maxPrice ? parseFloat(searchParams.maxPrice) : null

  const hasFilters = !!(timeOfDay || freqFilter.length || vehicleFilter.length || acOnly || maxPrice !== null)
  const isFiltered = isSearching || hasFilters

  const session  = await auth()
  const userCity = session?.user?.city
  // Default to routes touching the user's own city when they haven't
  // searched a specific route — mirrors the top-nav location switcher.
  const cityWhere = !isSearching && userCity
    ? { OR: [{ fromLocation: { contains: userCity } }, { toLocation: { contains: userCity } }] }
    : {}

  await expireOneTimeCarpoolRoutes()

  const allRoutes = await prisma.carpoolRoute.findMany({
    where: {
      isActive: true,
      ...cityWhere,
      ...(freqFilter.length > 0    ? { frequency:    { in: freqFilter    } } : {}),
      ...(vehicleFilter.length > 0 ? { vehicleType:  { in: vehicleFilter } } : {}),
      ...(acOnly                   ? { acAvailable:  true                  } : {}),
      ...(maxPrice !== null        ? { pricePerSeat: { lte: maxPrice }      } : {}),
    },
    orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
    take:    isFiltered ? 200 : 40,
    include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
  })

  // Post-filter: time of day (string-based), then geo if location is set
  const routes = allRoutes
    .filter((r) => matchesTimeFilter(r.departureTime, timeOfDay))
    .filter((r) => !isSearching || routeMatchesSearch(r, pickupLat!, pickupLng!, dropoffLat!, dropoffLng!))
    .slice(0, 40)

  const isPremium = session?.user?.membershipPlan === "PREMIUM"
  const myCarpoolCount = session?.user?.id && !isPremium
    ? await prisma.carpoolRoute.count({ where: { userId: session.user.id, isActive: true } })
    : 0

  const [activeRouteCount, seatsAgg, freqCountRows] = await Promise.all([
    prisma.carpoolRoute.count({ where: { isActive: true } }),
    prisma.carpoolRoute.aggregate({ where: { isActive: true }, _sum: { seatsAvailable: true } }),
    prisma.carpoolRoute.groupBy({ by: ["frequency"], where: { isActive: true }, _count: true }),
  ])
  const freqCounts = Object.fromEntries(freqCountRows.map((r) => [r.frequency, r._count]))

  const boostedCount = routes.filter((r) => r.isBoosted).length

  // Build a human-readable description of active filters
  const filterSummaryParts: string[] = []
  if (timeOfDay)                 filterSummaryParts.push(timeOfDay)
  if (freqFilter.length > 0)    filterSummaryParts.push(freqFilter.map((f) => FREQ_LABEL[f] ?? f).join(", "))
  if (vehicleFilter.length > 0) filterSummaryParts.push(vehicleFilter.join(", "))
  if (acOnly)                   filterSummaryParts.push("AC")
  if (maxPrice !== null)        filterSummaryParts.push(`≤ ₹${maxPrice}`)

  return (
    <div className="min-h-full bg-background">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=85&auto=format&fit=crop"
        eyebrow="Corporate Carpool"
        titleWhite="Share Your"
        titleAccent="Commute"
        description="Split the cost and the drive with verified colleagues."
        overlayFrom="from-orange-950/50" overlayTo="to-amber-950/40"
        blobFrom="bg-orange-500/30" blobTo="bg-amber-400/20"
        eyebrowGradient="from-orange-500/30 via-amber-500/30 to-yellow-400/30"
        ctaGradient="from-orange-500 via-amber-500 to-yellow-400"
        focusRing="focus:ring-orange-400/50"
        stats={[
          { value: activeRouteCount.toLocaleString(), label: "Active Routes", gradient: "from-orange-300 to-amber-200" },
          { value: (seatsAgg._sum.seatsAvailable ?? 0).toLocaleString(), label: "Seats Available", gradient: "from-emerald-300 to-teal-200" },
          { value: "100%", label: "Verified", gradient: "from-fuchsia-300 to-pink-200" },
        ]}
        primaryCta={{ href: "/carpool/new", label: "Offer Ride", icon: Plus }}
      />
      <CategoryStrip
        activeValue={freqFilter[0] ?? "All"}
        basePath="/carpool"
        paramName="freq"
        ringClass="ring-orange-400"
        glowShadow="shadow-[0_0_12px_rgba(251,146,60,0.4)]"
        underlineGradient="from-orange-500 to-amber-400"
        items={[
          { value: "All", label: "All", icon: "LayoutDashboard", iconBg: "bg-slate-100 dark:bg-white/10", iconColor: "text-slate-600 dark:text-white", count: activeRouteCount },
          ...Object.entries(FREQ_LABEL).map(([value, label]) => ({
            value,
            label,
            icon: FREQ_ICONS[value] ?? "Calendar",
            iconBg: "bg-orange-100 dark:bg-orange-500/20",
            iconColor: "text-orange-600 dark:text-orange-400",
            count: freqCounts[value] ?? 0,
          })),
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!isPremium && session?.user?.id && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-amber-700 dark:text-amber-300 font-medium">{myCarpoolCount}/{FREE_LIMITS.carpool} route posted</span>
            <Link href="/membership" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline"><Zap className="h-3 w-3" />Upgrade</Link>
          </div>
        </div>
      )}

      {/* Search + filter bar */}
      <Suspense fallback={<div className="h-24 rounded-2xl bg-muted animate-pulse mb-6" />}>
        <CarpoolSearchBar />
      </Suspense>

      {/* Results header */}
      {isFiltered && (
        <div id="carpool-results" className="flex items-center gap-3 mb-4 scroll-mt-24">
          <Search className="h-4 w-4 text-primary-600 shrink-0" />
          {routes.length > 0 ? (
            <p className="text-sm">
              <span className="font-semibold">{routes.length} ride{routes.length !== 1 ? "s" : ""}</span>
              {isSearching && (
                <> found between{" "}
                  <span className="font-medium">{searchParams.from}</span>
                  {" → "}
                  <span className="font-medium">{searchParams.to}</span>
                </>
              )}
              {filterSummaryParts.length > 0 && (
                <span className="text-muted-foreground"> · {filterSummaryParts.join(" · ")}</span>
              )}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No rides match
              {isSearching && <> between <span className="font-medium">{searchParams.from}</span> → <span className="font-medium">{searchParams.to}</span></>}
              {filterSummaryParts.length > 0 && <> with filters: {filterSummaryParts.join(" · ")}</>}.{" "}
              <Link href="/carpool" className="text-primary-600 hover:underline">Clear and see all</Link>
            </p>
          )}
        </div>
      )}

      {/* Boosted label */}
      {!isFiltered && boostedCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Boosted routes — shown first
          </span>
        </div>
      )}

      {routes.length === 0 && !isFiltered ? (
        <div className="text-center py-20">
          <Car className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">No carpool routes yet</h3>
          <p className="text-muted-foreground mb-6">Share your commute and split the cost!</p>
          <Button asChild><Link href="/carpool/new">Offer First Ride</Link></Button>
        </div>
      ) : routes.length === 0 && isFiltered ? null : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {routes.map((route) => {
            const isBoosted = route.isBoosted
            return (
              <Link key={route.id} href={`/carpool/${route.id}`} className="group flex flex-col">
                <div className={`bg-card border-2 rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-200 hover:-translate-y-1 ${
                  isBoosted
                    ? "border-amber-300 dark:border-amber-700 hover:shadow-[0_12px_36px_rgba(245,158,11,0.18)]"
                    : "border-border hover:border-orange-400/60 hover:shadow-[0_12px_36px_rgba(251,146,60,0.15)]"
                }`}>
                  {isBoosted && <PremiumStrip />}
                  <div className="p-5 flex flex-col flex-1">
                    {isBoosted && <div className="mb-2"><PremiumBadge variant="boosted" /></div>}

                    <div className="flex items-center gap-1.5 text-sm font-semibold flex-wrap">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{route.fromLocation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-semibold flex-wrap mt-1">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 rotate-90" />
                      <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                      <span className="truncate">{route.toLocation}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${FREQ_COLORS[route.frequency] ?? "border-border bg-muted text-muted-foreground"}`}>
                        {FREQ_LABEL[route.frequency] ?? route.frequency}
                      </span>
                      {route.frequency === "ONCE" && route.departureAt && (
                        <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{formatDate(route.departureAt)}</span>
                      )}
                      <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{route.departureTime}</span>
                      <span className="text-[11px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{route.vehicleType}</span>
                      {route.acAvailable && (
                        <span className="text-[11px] bg-sky-100 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full">AC</span>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-3">
                      <div>
                        <p className={`text-lg font-bold ${isBoosted ? "text-amber-600 dark:text-amber-400" : "text-primary-600"}`}>
                          {formatCurrency(route.pricePerSeat)}
                        </p>
                        <p className="text-[11px] text-muted-foreground">per seat</p>
                      </div>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                        {route.seatsAvailable} seat{route.seatsAvailable !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <UserCard user={route.user} size="sm" clickable={false} />
                        <SocialShare
                          title={`Carpool: ${route.fromLocation} → ${route.toLocation} on Korpo`}
                          path={`/carpool/${route.id}`}
                          variant="icon"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
