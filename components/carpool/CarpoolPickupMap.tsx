"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, CheckCircle2 } from "lucide-react"

export interface Stop { name: string; lat: number; lng: number }

interface Props {
  fromLat:          number
  fromLng:          number
  toLat:            number
  toLng:            number
  stops?:           Stop[]
  onPickupChange:   (lat: number, lng: number, name: string) => void
  onDropoffChange:  (lat: number, lng: number, name: string) => void
  pickupLat?:       number
  pickupLng?:       number
  dropoffLat?:      number
  dropoffLng?:      number
  height?:          number
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "User-Agent": "KorpoApp/1.0" } })
    const data = await res.json()
    const a    = data.address ?? {}
    return [a.suburb ?? a.neighbourhood ?? a.village ?? a.town ?? "", a.city ?? a.state_district ?? ""].filter(Boolean).join(", ") || data.display_name?.split(",").slice(0, 2).join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
}

async function fetchRoute(waypoints: { lat: number; lng: number }[]): Promise<[number, number][]> {
  if (waypoints.length < 2) return []
  try {
    const coords = waypoints.map((w) => `${w.lng},${w.lat}`).join(";")
    const res    = await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?geometries=geojson&overview=full`, { headers: { "User-Agent": "KorpoApp/1.0" } })
    const data   = await res.json()
    if (data.code !== "Ok") return []
    return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
  } catch { return [] }
}

function pinHtml(color: string, label: string) {
  return `<div style="position:relative;width:32px;height:44px;filter:drop-shadow(0 3px 8px rgba(0,0,0,.35))">
    <svg width="32" height="44" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 8.94 14 24 14 24S28 22.94 28 14C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="13.5" r="7" fill="white" opacity="0.9"/>
      <text x="14" y="18" text-anchor="middle" font-size="8" font-weight="bold" fill="${color}">${label}</text>
    </svg>
  </div>`
}

const isDark  = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
const tileUrl = (dark: boolean) => dark
  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

export function CarpoolPickupMap({
  fromLat, fromLng, toLat, toLng, stops = [],
  onPickupChange, onDropoffChange,
  pickupLat, pickupLng, dropoffLat, dropoffLng,
  height = 420,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)
  const pickupMkRef  = useRef<any>(null)
  const dropoffMkRef = useRef<any>(null)
  const clickModeRef = useRef<"pickup" | "dropoff">("pickup")

  const [clickMode,  setClickMode]  = useState<"pickup" | "dropoff">("pickup")
  const [geocoding,  setGeocoding]  = useState(false)
  const [pickupSet,  setPickupSet]  = useState(!!(pickupLat  && pickupLng))
  const [dropoffSet, setDropoffSet] = useState(!!(dropoffLat && dropoffLng))

  useEffect(() => { clickModeRef.current = clickMode }, [clickMode])

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return
    let map: any = null
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
        .setView([fromLat, fromLng], 13)
      L.tileLayer(tileUrl(isDark()), { attribution: "&copy; CARTO", subdomains: "abcd", maxZoom: 19 }).addTo(map)

      const mkIcon = (color: string, label: string) =>
        L.divIcon({ className: "", html: pinHtml(color, label), iconSize: [32, 44], iconAnchor: [16, 44] })

      // Driver route
      const waypoints   = [{ lat: fromLat, lng: fromLng }, ...stops, { lat: toLat, lng: toLng }]
      const routeCoords = await fetchRoute(waypoints)
      if (routeCoords.length > 0) {
        L.polyline(routeCoords, { color: "#3b82f6", weight: 6, opacity: 0.55 }).addTo(map)
      } else {
        L.polyline(waypoints.map((w) => [w.lat, w.lng] as [number, number]), { color: "#94a3b8", weight: 4, opacity: 0.45, dashArray: "6 4" }).addTo(map)
      }

      // Driver origin / dest / stops
      const dot = (color: string) =>
        L.divIcon({ className: "", html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] })
      L.marker([fromLat, fromLng], { icon: dot("#22c55e") }).addTo(map).bindPopup("Driver origin")
      L.marker([toLat,   toLng],   { icon: dot("#ef4444") }).addTo(map).bindPopup("Driver destination")
      stops.forEach((s, i) => {
        L.marker([s.lat, s.lng], { icon: dot("#f97316") }).addTo(map).bindPopup(`Stop ${i + 1}: ${s.name}`)
      })

      // Pre-populate existing markers
      if (pickupLat && pickupLng) {
        pickupMkRef.current = L.marker([pickupLat, pickupLng], { icon: mkIcon("#8b5cf6", "P"), draggable: true }).addTo(map)
        pickupMkRef.current.on("dragend", async (e: any) => {
          const { lat, lng } = e.target.getLatLng()
          setGeocoding(true)
          const name = await reverseGeocode(lat, lng)
          setGeocoding(false)
          onPickupChange(lat, lng, name)
        })
      }
      if (dropoffLat && dropoffLng) {
        dropoffMkRef.current = L.marker([dropoffLat, dropoffLng], { icon: mkIcon("#06b6d4", "D"), draggable: true }).addTo(map)
        dropoffMkRef.current.on("dragend", async (e: any) => {
          const { lat, lng } = e.target.getLatLng()
          setGeocoding(true)
          const name = await reverseGeocode(lat, lng)
          setGeocoding(false)
          onDropoffChange(lat, lng, name)
        })
      }

      map._L   = L
      mapRef.current = map

      // Ensure Leaflet recalculates size after modal/container paint
      setTimeout(() => { if (map) map.invalidateSize() }, 100)

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        setGeocoding(true)
        const name = await reverseGeocode(lat, lng)
        setGeocoding(false)

        if (clickModeRef.current === "pickup") {
          pickupMkRef.current?.remove()
          pickupMkRef.current = L.marker([lat, lng], { icon: mkIcon("#8b5cf6", "P"), draggable: true }).addTo(map)
          pickupMkRef.current.bindPopup(`<b>Your pickup</b><br><small>${name}</small>`).openPopup()
          pickupMkRef.current.on("dragend", async (ev: any) => {
            const p = ev.target.getLatLng()
            const n = await reverseGeocode(p.lat, p.lng)
            onPickupChange(p.lat, p.lng, n)
          })
          onPickupChange(lat, lng, name)
          setPickupSet(true)
          setClickMode("dropoff")
          clickModeRef.current = "dropoff"
        } else {
          dropoffMkRef.current?.remove()
          dropoffMkRef.current = L.marker([lat, lng], { icon: mkIcon("#06b6d4", "D"), draggable: true }).addTo(map)
          dropoffMkRef.current.bindPopup(`<b>Your drop-off</b><br><small>${name}</small>`).openPopup()
          dropoffMkRef.current.on("dragend", async (ev: any) => {
            const p = ev.target.getLatLng()
            const n = await reverseGeocode(p.lat, p.lng)
            onDropoffChange(p.lat, p.lng, n)
          })
          onDropoffChange(lat, lng, name)
          setDropoffSet(true)
        }
      })

      // Fit bounds
      const allPts = [[fromLat, fromLng], [toLat, toLng], ...stops.map((s) => [s.lat, s.lng])] as [number, number][]
      map.fitBounds(L.latLngBounds(allPts).pad(0.14))

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

  return (
    <div className="space-y-3">
      {/* Large mode buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setClickMode("pickup")}
          className={`relative flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border-2 font-semibold transition-all ${
            clickMode === "pickup"
              ? "border-violet-500 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 shadow-sm"
              : "border-border text-muted-foreground hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-950/20"
          }`}
        >
          {pickupSet && <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-violet-500" />}
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold border-2 ${
            clickMode === "pickup" ? "border-violet-500 bg-violet-500 text-white" : "border-muted-foreground/30 text-muted-foreground"
          }`}>P</div>
          <span className="text-sm">Set Pickup</span>
          <span className="text-xs font-normal text-muted-foreground text-center leading-tight">Click the map where you want to be picked up</span>
        </button>

        <button
          type="button"
          onClick={() => setClickMode("dropoff")}
          className={`relative flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-2xl border-2 font-semibold transition-all ${
            clickMode === "dropoff"
              ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 shadow-sm"
              : "border-border text-muted-foreground hover:border-cyan-300 dark:hover:border-cyan-700 hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20"
          }`}
        >
          {dropoffSet && <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-cyan-500" />}
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-lg font-bold border-2 ${
            clickMode === "dropoff" ? "border-cyan-500 bg-cyan-500 text-white" : "border-muted-foreground/30 text-muted-foreground"
          }`}>D</div>
          <span className="text-sm">Set Drop-off</span>
          <span className="text-xs font-normal text-muted-foreground text-center leading-tight">Click the map where you want to be dropped off</span>
        </button>
      </div>

      {/* Active hint */}
      <div className={`text-xs rounded-xl px-3 py-2.5 flex items-center gap-2 font-medium ${
        clickMode === "pickup"
          ? "bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800"
          : "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800"
      }`}>
        <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${clickMode === "pickup" ? "bg-violet-500" : "bg-cyan-500"}`} />
        {clickMode === "pickup" ? "Click anywhere on the map to pin your pickup point" : "Click anywhere on the map to pin your drop-off point"}
      </div>

      {geocoding && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />Getting location name…
        </div>
      )}

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height }}>
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="inline-block h-1.5 w-5 rounded-full bg-blue-400 opacity-70" />Driver route</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-violet-500 shrink-0" />Your pickup (P)</span>
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-cyan-500 shrink-0" />Your drop-off (D)</span>
        <span className="text-muted-foreground/60 italic">Drag to fine-tune</span>
      </div>
    </div>
  )
}
