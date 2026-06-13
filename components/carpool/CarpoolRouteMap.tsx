"use client"

import { useEffect, useRef } from "react"
import { MapPin } from "lucide-react"

export interface Stop { name: string; lat: number; lng: number }
export interface RiderMark {
  lat:   number
  lng:   number
  label: string
  type:  "pickup" | "dropoff"
  name:  string
}

interface Props {
  fromLat:      number
  fromLng:      number
  fromLocation: string
  toLat:        number
  toLng:        number
  toLocation:   string
  stops?:       Stop[]
  riderMarks?:  RiderMark[]
  height?:      number
}

function pinHtml(color: string, label?: string, small?: boolean) {
  const w = small ? 22 : 28; const h = small ? 30 : 38
  return `<div style="position:relative;width:${w}px;height:${h}px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.3))">
    <svg width="${w}" height="${h}" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 8.94 14 24 14 24S28 22.94 28 14C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="13.5" r="7" fill="white" opacity="0.9"/>
      ${label ? `<text x="14" y="18" text-anchor="middle" font-size="8" font-weight="bold" fill="${color}">${label}</text>` : `<circle cx="14" cy="13.5" r="3.5" fill="${color}"/>`}
    </svg>
  </div>`
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

const isDark  = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
const tileUrl = (dark: boolean) => dark
  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

export function CarpoolRouteMap({
  fromLat, fromLng, fromLocation,
  toLat, toLng, toLocation,
  stops = [], riderMarks = [], height = 300,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)

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

      const mkIcon = (color: string, label?: string, small?: boolean) =>
        L.divIcon({ className: "", html: pinHtml(color, label, small), iconSize: [small ? 22 : 28, small ? 30 : 38], iconAnchor: [small ? 11 : 14, small ? 30 : 38] })

      map = L.map(containerRef.current, { zoomControl: true, attributionControl: false, scrollWheelZoom: false })
        .setView([fromLat, fromLng], 12)
      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map)
      L.tileLayer(tileUrl(isDark()), { attribution: '&copy; <a href="https://carto.com/">CARTO</a>', subdomains: "abcd", maxZoom: 19 }).addTo(map)

      // From marker
      L.marker([fromLat, fromLng], { icon: mkIcon("#22c55e") }).addTo(map)
        .bindPopup(`<div style="font-size:11px"><b>Origin</b><br/>${fromLocation}</div>`)

      // To marker
      L.marker([toLat, toLng], { icon: mkIcon("#ef4444") }).addTo(map)
        .bindPopup(`<div style="font-size:11px"><b>Destination</b><br/>${toLocation}</div>`)

      // Stop markers
      stops.forEach((s, i) => {
        L.marker([s.lat, s.lng], { icon: mkIcon("#f97316", `${i + 1}`) }).addTo(map)
          .bindPopup(`<div style="font-size:11px"><b>Stop ${i + 1}</b><br/>${s.name}</div>`)
      })

      // Rider markers
      riderMarks.forEach((r) => {
        const color = r.type === "pickup" ? "#8b5cf6" : "#06b6d4"
        L.marker([r.lat, r.lng], { icon: mkIcon(color, undefined, true) }).addTo(map)
          .bindPopup(`<div style="font-size:11px"><b>${r.type === "pickup" ? "Pickup" : "Drop-off"}</b><br/>${r.label}<br/><small>${r.name}</small></div>`)
      })

      // Fetch and draw route
      const waypoints = [{ lat: fromLat, lng: fromLng }, ...stops, { lat: toLat, lng: toLng }]
      const routeCoords = await fetchRoute(waypoints)

      if (routeCoords.length > 0) {
        L.polyline(routeCoords, { color: "#3b82f6", weight: 5, opacity: 0.75 }).addTo(map)
      } else {
        // fallback straight line
        L.polyline(waypoints.map((w) => [w.lat, w.lng] as [number, number]), { color: "#3b82f6", weight: 3, opacity: 0.5, dashArray: "6 4" }).addTo(map)
      }

      // Fit bounds
      const allPts = [
        [fromLat, fromLng], [toLat, toLng],
        ...stops.map((s) => [s.lat, s.lng]),
        ...riderMarks.map((r) => [r.lat, r.lng]),
      ] as [number, number][]
      map.fitBounds(L.latLngBounds(allPts).pad(0.12))
      mapRef.current = map

      observer = new MutationObserver(() => {
        map.eachLayer((l: any) => { if (l._url) l.setUrl(tileUrl(isDark())) })
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    })

    return () => {
      observer?.disconnect()
      if (map) { map.remove(); mapRef.current = null }
    }
  }, [fromLat, fromLng, toLat, toLng]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height }}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
