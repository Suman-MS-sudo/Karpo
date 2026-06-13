"use client"

import { useEffect, useRef } from "react"

interface Stop { name: string; lat: number; lng: number }

interface Props {
  fromLat:    number
  fromLng:    number
  toLat:      number
  toLng:      number
  stops?:     Stop[]
  pickupLat:  number
  pickupLng:  number
  dropoffLat?: number | null
  dropoffLng?: number | null
  height?:    number
}

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

function pinHtml(color: string, label: string) {
  return `<div style="filter:drop-shadow(0 2px 6px rgba(0,0,0,.35))">
    <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
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

export function CarpoolRiderRouteMap({
  fromLat, fromLng, toLat, toLng, stops = [],
  pickupLat, pickupLng, dropoffLat, dropoffLng,
  height = 300,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

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

      map = L.map(containerRef.current, {
        zoomControl:      true,
        attributionControl: false,
        scrollWheelZoom:  false,
        dragging:         true,
      }).setView([pickupLat, pickupLng], 13)

      L.tileLayer(tileUrl(isDark()), { subdomains: "abcd", maxZoom: 19 }).addTo(map)

      const mkIcon = (color: string, label: string) =>
        L.divIcon({ className: "", html: pinHtml(color, label), iconSize: [28, 38], iconAnchor: [14, 38] })
      const dot = (color: string, popup: string) =>
        L.marker([] as any, {
          icon: L.divIcon({
            className: "",
            html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`,
            iconSize: [10, 10], iconAnchor: [5, 5],
          }),
        })

      // Full driver route (faded)
      const allWaypoints = [{ lat: fromLat, lng: fromLng }, ...stops, { lat: toLat, lng: toLng }]
      const fullRoute    = await fetchRoute(allWaypoints)
      if (fullRoute.length > 0) {
        L.polyline(fullRoute, { color: "#94a3b8", weight: 4, opacity: 0.4, dashArray: "7 5" }).addTo(map)
      } else {
        L.polyline(allWaypoints.map((w) => [w.lat, w.lng] as [number, number]), { color: "#94a3b8", weight: 3, opacity: 0.35, dashArray: "6 4" }).addTo(map)
      }

      // Rider's segment: pickup → dropoff (solid, highlighted)
      const hasDropoff = !!(dropoffLat && dropoffLng)
      const segWaypoints = hasDropoff
        ? [{ lat: pickupLat, lng: pickupLng }, { lat: dropoffLat!, lng: dropoffLng! }]
        : [{ lat: pickupLat, lng: pickupLng }, { lat: toLat, lng: toLng }]

      const segRoute = await fetchRoute(segWaypoints)
      if (segRoute.length > 0) {
        L.polyline(segRoute, { color: "#8b5cf6", weight: 5, opacity: 0.85 }).addTo(map)
      }

      // Driver from/to dots
      L.marker([fromLat, fromLng], {
        icon: L.divIcon({ className: "", html: `<div style="width:10px;height:10px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`, iconSize: [10, 10], iconAnchor: [5, 5] })
      }).addTo(map).bindPopup("Driver origin")

      L.marker([toLat, toLng], {
        icon: L.divIcon({ className: "", html: `<div style="width:10px;height:10px;border-radius:50%;background:#ef4444;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></div>`, iconSize: [10, 10], iconAnchor: [5, 5] })
      }).addTo(map).bindPopup("Driver destination")

      // Rider pickup + dropoff pins
      L.marker([pickupLat, pickupLng], { icon: mkIcon("#8b5cf6", "P") }).addTo(map).bindPopup("<b>Your pickup</b>")

      if (hasDropoff) {
        L.marker([dropoffLat!, dropoffLng!], { icon: mkIcon("#06b6d4", "D") }).addTo(map).bindPopup("<b>Your drop-off</b>")
      }

      // Fit bounds around the rider's journey
      const pts: [number, number][] = [[fromLat, fromLng], [toLat, toLng], [pickupLat, pickupLng]]
      if (hasDropoff) pts.push([dropoffLat!, dropoffLng!])
      map.fitBounds(L.latLngBounds(pts).pad(0.18))

      observer = new MutationObserver(() => {
        map.eachLayer((l: any) => { if (l._url) l.setUrl(tileUrl(isDark())) })
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    })

    return () => {
      observer?.disconnect()
      if (map) { map.remove(); mapRef.current = null }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // keep ref for cleanup
  const mapRef = useRef<any>(null)

  return (
    <div className="space-y-2">
      <div style={{ height }} className="w-full rounded-b-xl overflow-hidden">
        <div ref={containerRef} className="w-full h-full" />
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 px-3 pb-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-1.5 w-4 rounded bg-slate-400 opacity-60" style={{ borderTop: "2px dashed" }} />Full route</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-4 rounded bg-violet-500" />Your segment</span>
        <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-violet-500 shrink-0" />Pickup (P)</span>
        {dropoffLat && <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-cyan-500 shrink-0" />Drop-off (D)</span>}
      </div>
    </div>
  )
}
