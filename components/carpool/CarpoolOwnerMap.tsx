"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2 } from "lucide-react"

export interface RiderPoint {
  name:        string
  pickupLat?:  number | null
  pickupLng?:  number | null
  dropoffLat?: number | null
  dropoffLng?: number | null
}

interface Stop { name: string; lat: number; lng: number }

interface Props {
  fromLat:  number
  fromLng:  number
  toLat:    number
  toLng:    number
  stops?:   Stop[]
  riders:   RiderPoint[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function fetchRoute(waypoints: { lat: number; lng: number }[]): Promise<[number, number][]> {
  if (waypoints.length < 2) return []
  try {
    const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(";")
    const res    = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson&overview=full`,
      { headers: { "User-Agent": "KorpoApp/1.0" } }
    )
    const data = await res.json()
    if (data.code !== "Ok" || !data.routes?.[0]) return []
    return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
  } catch { return [] }
}

// Project a point onto the from→to vector to get its order along the route (0=from, 1=to)
function routeT(lat: number, lng: number, fromLat: number, fromLng: number, toLat: number, toLng: number): number {
  const dx = toLng - fromLng, dy = toLat - fromLat
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return 0
  return Math.max(0, Math.min(1, ((lng - fromLng) * dx + (lat - fromLat) * dy) / lenSq))
}

function pinHtml(color: string, text: string) {
  return `<div style="position:relative;filter:drop-shadow(0 2px 6px rgba(0,0,0,.35))">
    <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 8.94 14 24 14 24S28 22.94 28 14C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="13.5" r="7" fill="white" opacity="0.9"/>
      <text x="14" y="18" text-anchor="middle" font-size="7" font-weight="bold" fill="${color}">${text}</text>
    </svg>
  </div>`
}

const isDark  = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
const tileUrl = (dark: boolean) => dark
  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

// ── Component ──────────────────────────────────────────────────────────────────

export function CarpoolOwnerMap({ fromLat, fromLng, toLat, toLng, stops = [], riders }: Props) {
  const containerRef   = useRef<HTMLDivElement>(null)
  const mapRef         = useRef<any>(null)
  const origLineRef    = useRef<any>(null)
  const optLineRef     = useRef<any>(null)

  const [loading,      setLoading]     = useState(true)
  const [showOptimized, setShowOptimized] = useState(true)
  const [showOriginal,  setShowOriginal]  = useState(true)
  const [optDist,      setOptDist]     = useState<string | null>(null)
  const [origDist,     setOrigDist]    = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return
    let map: any  = null
    let observer: MutationObserver | null = null

    import("leaflet").then(async (L) => {
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) return

      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link")
        link.id = "leaflet-css"; link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      map = L.map(containerRef.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: true })
        .setView([fromLat, fromLng], 12)
      L.tileLayer(tileUrl(isDark()), { subdomains: "abcd", maxZoom: 19 }).addTo(map)
      map._L = L
      mapRef.current = map

      const mkIcon = (color: string, text: string) =>
        L.divIcon({ className: "", html: pinHtml(color, text), iconSize: [28, 38], iconAnchor: [14, 38] })
      const dot = (color: string) =>
        L.divIcon({ className: "", html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] })

      // ── Original route ─────────────────────────────────────────────────────
      const origWaypoints = [{ lat: fromLat, lng: fromLng }, ...stops, { lat: toLat, lng: toLng }]
      const [origCoords] = await Promise.all([fetchRoute(origWaypoints)])

      if (origCoords.length > 0) {
        origLineRef.current = L.polyline(origCoords, { color: "#94a3b8", weight: 5, opacity: 0.6, dashArray: "8 5" }).addTo(map)
        // Approximate distance (sum of segments in km)
        let d = 0
        for (let i = 1; i < origCoords.length; i++) {
          const [la, lo] = origCoords[i], [pa, po] = origCoords[i - 1]
          const R = 6371, dLa = (la - pa) * Math.PI / 180, dLo = (lo - po) * Math.PI / 180
          const a = Math.sin(dLa/2)**2 + Math.cos(pa * Math.PI/180) * Math.cos(la * Math.PI/180) * Math.sin(dLo/2)**2
          d += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        }
        setOrigDist(d.toFixed(1))
      } else {
        origLineRef.current = L.polyline(origWaypoints.map((w) => [w.lat, w.lng] as [number, number]), { color: "#94a3b8", weight: 3, opacity: 0.4, dashArray: "6 4" }).addTo(map)
      }

      // Driver from/to/stop dots
      L.marker([fromLat, fromLng], { icon: dot("#22c55e") }).addTo(map).bindPopup("Driver origin")
      L.marker([toLat,   toLng],   { icon: dot("#ef4444") }).addTo(map).bindPopup("Driver destination")
      stops.forEach((s, i) => {
        L.marker([s.lat, s.lng], { icon: dot("#f97316") }).addTo(map).bindPopup(`Stop ${i + 1}: ${s.name}`)
      })

      // ── Rider markers ──────────────────────────────────────────────────────
      const allPts: [number, number][] = [[fromLat, fromLng], [toLat, toLng]]

      for (const r of riders) {
        const firstName = (r.name ?? "Rider").split(" ")[0].slice(0, 4)
        if (r.pickupLat && r.pickupLng) {
          L.marker([r.pickupLat, r.pickupLng], { icon: mkIcon("#8b5cf6", "P") })
            .addTo(map)
            .bindPopup(`<b>${r.name}</b><br>Pickup`)
          allPts.push([r.pickupLat, r.pickupLng])
          // Label below pin
          L.marker([r.pickupLat, r.pickupLng], {
            icon: L.divIcon({ className: "", html: `<div style="font-size:10px;font-weight:600;color:#7c3aed;white-space:nowrap;margin-top:2px;text-shadow:0 1px 2px white">${firstName}</div>`, iconSize: [40, 14], iconAnchor: [-2, -2] }),
            interactive: false,
          }).addTo(map)
        }
        if (r.dropoffLat && r.dropoffLng) {
          L.marker([r.dropoffLat, r.dropoffLng], { icon: mkIcon("#06b6d4", "D") })
            .addTo(map)
            .bindPopup(`<b>${r.name}</b><br>Drop-off`)
          allPts.push([r.dropoffLat, r.dropoffLng])
          L.marker([r.dropoffLat, r.dropoffLng], {
            icon: L.divIcon({ className: "", html: `<div style="font-size:10px;font-weight:600;color:#0891b2;white-space:nowrap;margin-top:2px;text-shadow:0 1px 2px white">${firstName}</div>`, iconSize: [40, 14], iconAnchor: [-2, -2] }),
            interactive: false,
          }).addTo(map)
        }
      }

      // ── Optimized route through all rider waypoints ────────────────────────
      // Collect pickup + dropoff points and sort by their position along from→to line
      type WP = { lat: number; lng: number; t: number; kind: "pickup" | "dropoff"; name: string }
      const riderWps: WP[] = []
      for (const r of riders) {
        if (r.pickupLat && r.pickupLng) {
          riderWps.push({ lat: r.pickupLat, lng: r.pickupLng, kind: "pickup", name: r.name ?? "Rider", t: routeT(r.pickupLat, r.pickupLng, fromLat, fromLng, toLat, toLng) })
        }
        if (r.dropoffLat && r.dropoffLng) {
          riderWps.push({ lat: r.dropoffLat, lng: r.dropoffLng, kind: "dropoff", name: r.name ?? "Rider", t: routeT(r.dropoffLat, r.dropoffLng, fromLat, fromLng, toLat, toLng) })
        }
      }
      riderWps.sort((a, b) => a.t - b.t)

      if (riderWps.length > 0) {
        const optWaypoints = [
          { lat: fromLat, lng: fromLng },
          ...stops,
          ...riderWps.map((w) => ({ lat: w.lat, lng: w.lng })),
          { lat: toLat, lng: toLng },
        ]
        // Deduplicate consecutive identical points
        const deduped = optWaypoints.filter((w, i) =>
          i === 0 || (w.lat !== optWaypoints[i - 1].lat || w.lng !== optWaypoints[i - 1].lng)
        )
        const optCoords = await fetchRoute(deduped)
        if (optCoords.length > 0) {
          optLineRef.current = L.polyline(optCoords, { color: "#f97316", weight: 5, opacity: 0.85 }).addTo(map)
          let d = 0
          for (let i = 1; i < optCoords.length; i++) {
            const [la, lo] = optCoords[i], [pa, po] = optCoords[i - 1]
            const R = 6371, dLa = (la - pa) * Math.PI / 180, dLo = (lo - po) * Math.PI / 180
            const a = Math.sin(dLa/2)**2 + Math.cos(pa * Math.PI/180) * Math.cos(la * Math.PI/180) * Math.sin(dLo/2)**2
            d += R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
          }
          setOptDist(d.toFixed(1))
        }
      }

      // Fit bounds
      if (allPts.length > 1) {
        map.fitBounds(L.latLngBounds(allPts).pad(0.15))
      }

      setLoading(false)

      observer = new MutationObserver(() => {
        map.eachLayer((l: any) => { if (l._url) l.setUrl(tileUrl(isDark())) })
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    })

    return () => {
      observer?.disconnect()
      if (map) { map.remove(); mapRef.current = null }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle routes
  useEffect(() => {
    const line = origLineRef.current
    const map  = mapRef.current
    if (!line || !map) return
    if (showOriginal) line.addTo(map)
    else line.remove()
  }, [showOriginal])

  useEffect(() => {
    const line = optLineRef.current
    const map  = mapRef.current
    if (!line || !map) return
    if (showOptimized) line.addTo(map)
    else line.remove()
  }, [showOptimized])

  const riderCount = riders.filter((r) => r.pickupLat || r.dropoffLat).length

  return (
    <div className="space-y-3 mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Route Overview</p>
        {riderCount > 0 && (
          <span className="text-xs text-muted-foreground">{riderCount} rider{riderCount !== 1 ? "s" : ""} on map</span>
        )}
      </div>

      {/* Route toggles */}
      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowOriginal((v) => !v)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
            showOriginal
              ? "border-slate-400 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              : "border-border text-muted-foreground opacity-50"
          }`}
        >
          <span className="inline-block w-4 h-0.5 bg-slate-400" style={{ borderTop: "2px dashed currentColor" }} />
          Original route{origDist ? ` (${origDist} km)` : ""}
        </button>
        {riderCount > 0 && (
          <button
            type="button"
            onClick={() => setShowOptimized((v) => !v)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              showOptimized
                ? "border-orange-400 bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300"
                : "border-border text-muted-foreground opacity-50"
            }`}
          >
            <span className="inline-block w-4 h-0.5 bg-orange-400" />
            With all riders{optDist ? ` (${optDist} km)` : ""}
          </button>
        )}
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: 380 }}>
        {loading && (
          <div className="absolute inset-0 bg-muted/80 flex items-center justify-center z-10 rounded-2xl">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />Driver origin</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />Driver dest.</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-violet-500 shrink-0" />Pickup (P)</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shrink-0" />Drop-off (D)</span>
      </div>
    </div>
  )
}
