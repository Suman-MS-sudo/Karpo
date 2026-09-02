"use client"
import { useEffect, useRef } from "react"
import { MapPin } from "lucide-react"
import { MAP_ATTRIBUTION, MAP_DARK_FILTER_CLASS, MAP_TILE_SUBDOMAINS, tileUrl } from "@/lib/mapTiles"

interface Props {
  latitude: number
  longitude: number
  address?: string
  zoom?: number
}

const PIN_HTML = `
<div style="position:relative;width:28px;height:38px;filter:drop-shadow(0 4px 8px rgba(79,70,229,0.45))">
  <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="mvg" cx="38%" cy="32%" r="70%">
        <stop offset="0%" stop-color="#a5b4fc"/>
        <stop offset="100%" stop-color="#4338ca"/>
      </radialGradient>
    </defs>
    <path d="M14 0C6.27 0 0 6.27 0 14c0 8.94 14 24 14 24S28 22.94 28 14C28 6.27 21.73 0 14 0z" fill="url(#mvg)"/>
    <circle cx="14" cy="13.5" r="7" fill="white" opacity="0.9"/>
    <circle cx="14" cy="13.5" r="3.5" fill="#4338ca"/>
  </svg>
</div>`

export function MapView({ latitude, longitude, address, zoom = 15 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    let map: any = null

    import("leaflet").then((L) => {
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) return

      // Inject leaflet CSS once
      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link")
        link.id   = "leaflet-css"
        link.rel  = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      }).setView([latitude, longitude], zoom)

      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map)

      L.tileLayer(tileUrl(), {
        attribution: MAP_ATTRIBUTION,
        subdomains: MAP_TILE_SUBDOMAINS,
        maxZoom: 19,
      }).addTo(map)

      const icon = L.divIcon({
        className: "",
        html: PIN_HTML,
        iconSize:   [28, 38],
        iconAnchor: [14, 38],
        popupAnchor:[0, -38],
      })

      const marker = L.marker([latitude, longitude], { icon }).addTo(map)
      if (address) {
        marker.bindPopup(`<div style="font-size:12px;max-width:220px;line-height:1.4">${address}</div>`)
      }

      mapRef.current = map
    })

    return () => {
      if (map) { map.remove(); mapRef.current = null }
    }
  }, [latitude, longitude]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`rounded-2xl overflow-hidden border border-border shadow-sm ${MAP_DARK_FILTER_CLASS}`} style={{ height: 260 }}>
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
