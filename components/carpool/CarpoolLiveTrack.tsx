"use client"

import { useEffect, useRef, useState } from "react"
import { Navigation, Clock, MapPin, Loader2, WifiOff, Car } from "lucide-react"

interface TrackData {
  rideStatus: string
  lat:        number | null
  lng:        number | null
  updatedAt:  string | null
}

interface Props {
  routeId:    string
  pickupLat?: number
  pickupLng?: number
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function secondsAgo(isoStr: string) {
  return Math.round((Date.now() - new Date(isoStr).getTime()) / 1000)
}

function carSvg(color = "#f97316") {
  return `<div style="filter:drop-shadow(0 3px 8px rgba(0,0,0,.4));transform:translateX(-50%) translateY(-50%)">
    <svg width="38" height="38" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="19" cy="30" rx="12" ry="4" fill="rgba(0,0,0,0.15)"/>
      <rect x="4" y="14" width="30" height="16" rx="4" fill="${color}"/>
      <rect x="7" y="8"  width="24" height="12" rx="3" fill="${color}"/>
      <rect x="9"  y="9"  width="9"  height="8" rx="2" fill="rgba(180,230,255,0.8)"/>
      <rect x="20" y="9"  width="9"  height="8" rx="2" fill="rgba(180,230,255,0.8)"/>
      <circle cx="11" cy="30" r="4" fill="#333"/><circle cx="11" cy="30" r="2" fill="#aaa"/>
      <circle cx="27" cy="30" r="4" fill="#333"/><circle cx="27" cy="30" r="2" fill="#aaa"/>
      <rect x="4"  y="18" width="3"  height="4" rx="1" fill="#fbbf24"/>
      <rect x="31" y="18" width="3"  height="4" rx="1" fill="#ef4444"/>
    </svg>
  </div>`
}

const isDark  = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
const tileUrl = (dark: boolean) => dark
  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

function pinHtml(color: string, label: string) {
  return `<div style="filter:drop-shadow(0 2px 5px rgba(0,0,0,.35))">
    <svg width="26" height="36" viewBox="0 0 26 36" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 0C5.82 0 0 5.82 0 13c0 8.78 13 23 13 23S26 21.78 26 13C26 5.82 20.18 0 13 0z" fill="${color}"/>
      <circle cx="13" cy="12.5" r="6.5" fill="white" opacity="0.9"/>
      <text x="13" y="17" text-anchor="middle" font-size="7" font-weight="bold" fill="${color}">${label}</text>
    </svg>
  </div>`
}

export function CarpoolLiveTrack({ routeId, pickupLat, pickupLng }: Props) {
  const [data,       setData]       = useState<TrackData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState("")
  const [showMap,    setShowMap]    = useState(false)
  const [tickSec,    setTickSec]    = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const carMkRef     = useRef<any>(null)
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const tickRef      = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchTrack() {
    try {
      const res  = await fetch(`/api/carpool/${routeId}/track`)
      if (!res.ok) { if (res.status !== 403) setError("Failed to load tracking data"); return }
      const d: TrackData = await res.json()
      setData(d); setError("")
    } catch { setError("Network error") }
    finally   { setLoading(false) }
  }

  // Poll every 10 seconds
  useEffect(() => {
    fetchTrack()
    intervalRef.current = setInterval(fetchTrack, 10_000)
    tickRef.current     = setInterval(() => setTickSec((s) => s + 1), 1000)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (tickRef.current)     clearInterval(tickRef.current)
    }
  }, [routeId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Build / update map
  useEffect(() => {
    if (!showMap || !containerRef.current || !data?.lat || !data?.lng) return

    import("leaflet").then((L) => {
      if (!containerRef.current) return

      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"; link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      if (!(containerRef.current as any)._leaflet_id) {
        const map = L.map(containerRef.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: false })
          .setView([data.lat!, data.lng!], 14)
        L.tileLayer(tileUrl(isDark()), { subdomains: "abcd", maxZoom: 19 }).addTo(map)
        mapRef.current = map

        // Pickup pin
        if (pickupLat && pickupLng) {
          L.marker([pickupLat, pickupLng], {
            icon: L.divIcon({ className: "", html: pinHtml("#22c55e", "P"), iconSize: [26, 36], iconAnchor: [13, 36] }),
            interactive: false,
          }).addTo(map)
        }

        // Dark mode tile swap
        const obs = new MutationObserver(() => {
          map.eachLayer((l: any) => { if (l._url) l.setUrl(tileUrl(isDark())) })
        })
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
      }

      const map = mapRef.current
      const pos: [number, number] = [data.lat!, data.lng!]

      // Car marker
      const carIcon = L.divIcon({ className: "", html: carSvg(), iconSize: [38, 38], iconAnchor: [19, 19] })
      if (carMkRef.current) {
        carMkRef.current.setLatLng(pos)
      } else {
        carMkRef.current = L.marker(pos, { icon: carIcon, interactive: false, zIndexOffset: 1000 }).addTo(map)
        map.setView(pos, 14)
      }

      // Pan map towards car when close to pickup
      if (pickupLat && pickupLng) {
        const dist = haversineKm(data.lat!, data.lng!, pickupLat, pickupLng)
        if (dist < 3) {
          const bounds = L.latLngBounds([[data.lat!, data.lng!], [pickupLat, pickupLng]]).pad(0.3)
          map.fitBounds(bounds)
        }
      }
    })
  }, [data, showMap]) // eslint-disable-line react-hooks/exhaustive-deps

  // Clean up map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading ride status…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-xs text-red-500 py-2">
        <WifiOff className="h-3.5 w-3.5 shrink-0" /> {error}
      </div>
    )
  }

  if (!data) return null

  const isActive    = data.rideStatus === "ACTIVE"
  const hasFix      = isActive && data.lat !== null && data.lng !== null
  const distKm      = hasFix && pickupLat && pickupLng
    ? haversineKm(data.lat!, data.lng!, pickupLat, pickupLng)
    : null
  const secAgo      = data.updatedAt ? secondsAgo(data.updatedAt) : null
  const isStale     = secAgo !== null && secAgo > 60

  return (
    <div className={`rounded-2xl border p-4 transition-all ${
      isActive
        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700"
        : "bg-muted/40 border-border"
    }`}>
      {/* Status row */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
          isActive ? "bg-emerald-500" : "bg-muted"
        }`}>
          <Car className={`h-4 w-4 ${isActive ? "text-white" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isActive && <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
            <p className="font-semibold text-sm">
              {isActive ? "Ride is active" : "Waiting for driver"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            {isActive
              ? hasFix
                ? `Driver's location updated ${secAgo !== null ? `${secAgo}s` : "recently"} ago`
                : "Driver started — waiting for GPS fix"
              : "Driver will start the ride shortly before departure"}
          </p>
        </div>
      </div>

      {/* Distance + staleness */}
      {hasFix && (
        <div className="flex flex-wrap gap-3 mb-3 text-xs">
          {distKm !== null && (
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${
              distKm < 0.5
                ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                : "bg-muted border-border text-muted-foreground"
            }`}>
              <Navigation className="h-3 w-3" />
              {distKm < 1
                ? `${Math.round(distKm * 1000)}m from your pickup`
                : `${distKm.toFixed(1)} km from your pickup`}
            </div>
          )}
          {isStale && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
              <Clock className="h-3 w-3" />
              Signal lost — last seen {Math.round(secAgo! / 60)}m ago
            </div>
          )}
        </div>
      )}

      {/* Map toggle */}
      {hasFix && (
        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className="text-xs font-medium flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 hover:underline mb-3"
        >
          <MapPin className="h-3.5 w-3.5" />
          {showMap ? "Hide map" : "Show driver on map"}
        </button>
      )}

      {showMap && hasFix && (
        <>
          <div className="rounded-xl overflow-hidden border border-border shadow-sm mb-2" style={{ height: 280 }}>
            <div ref={containerRef} className="w-full h-full" />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">🚗 Driver location</span>
            {pickupLat && pickupLng && <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Your pickup</span>}
          </div>
        </>
      )}

      {!isActive && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          Refreshes automatically every 10 seconds
        </p>
      )}
    </div>
  )
}
