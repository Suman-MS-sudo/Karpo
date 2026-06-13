"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Navigation } from "lucide-react"

interface Props {
  onPickup:  (lat: number, lng: number, name: string) => void
  onDropoff: (lat: number, lng: number, name: string) => void
  pickupLat?:  number
  pickupLng?:  number
  dropoffLat?: number
  dropoffLng?: number
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "User-Agent": "KorpoApp/1.0" } })
    const data = await res.json()
    const a    = data.address ?? {}
    return [a.suburb ?? a.neighbourhood ?? a.village ?? a.town ?? "", a.city ?? a.state_district ?? ""].filter(Boolean).join(", ")
      || data.display_name?.split(",").slice(0, 3).join(", ")
      || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
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

export function CarpoolSearchMap({ onPickup, onDropoff, pickupLat, pickupLng, dropoffLat, dropoffLng }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<any>(null)
  const pickupMkRef   = useRef<any>(null)
  const dropoffMkRef  = useRef<any>(null)
  const modeRef       = useRef<"pickup" | "dropoff">("pickup")

  const [mode,      setMode]      = useState<"pickup" | "dropoff">("pickup")
  const [geocoding, setGeocoding] = useState(false)
  const [locating,  setLocating]  = useState(false)
  const [pickupSet,  setPickupSet]  = useState(!!(pickupLat && pickupLng))
  const [dropoffSet, setDropoffSet] = useState(!!(dropoffLat && dropoffLng))

  useEffect(() => { modeRef.current = mode }, [mode])

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
        .setView([20.5937, 78.9629], 5)
      L.tileLayer(tileUrl(isDark()), { subdomains: "abcd", maxZoom: 19 }).addTo(map)
      map._L = L
      mapRef.current = map

      const mkIcon = (color: string, label: string) =>
        L.divIcon({ className: "", html: pinHtml(color, label), iconSize: [28, 38], iconAnchor: [14, 38] })

      // Pre-populate if values already set
      if (pickupLat && pickupLng) {
        pickupMkRef.current = L.marker([pickupLat, pickupLng], { icon: mkIcon("#22c55e", "P"), draggable: true }).addTo(map)
        pickupMkRef.current.on("dragend", async (e: any) => {
          const { lat, lng } = e.target.getLatLng()
          setGeocoding(true)
          const name = await reverseGeocode(lat, lng)
          setGeocoding(false)
          onPickup(lat, lng, name)
        })
      }
      if (dropoffLat && dropoffLng) {
        dropoffMkRef.current = L.marker([dropoffLat, dropoffLng], { icon: mkIcon("#ef4444", "D"), draggable: true }).addTo(map)
        dropoffMkRef.current.on("dragend", async (e: any) => {
          const { lat, lng } = e.target.getLatLng()
          setGeocoding(true)
          const name = await reverseGeocode(lat, lng)
          setGeocoding(false)
          onDropoff(lat, lng, name)
        })
        if (pickupLat && pickupLng) {
          map.fitBounds(L.latLngBounds([[pickupLat, pickupLng], [dropoffLat, dropoffLng]]).pad(0.2))
        }
      }

      // Auto-locate
      if (!pickupLat && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 13)
            const pulseHtml = `<div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:2.5px solid white;box-shadow:0 0 0 5px rgba(59,130,246,0.25)"></div>`
            L.marker([pos.coords.latitude, pos.coords.longitude], {
              icon: L.divIcon({ className: "", html: pulseHtml, iconSize: [14, 14], iconAnchor: [7, 7] }),
              interactive: false,
            }).addTo(map)
          },
          () => {},
          { timeout: 8000 }
        )
      }

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        setGeocoding(true)
        const name = await reverseGeocode(lat, lng)
        setGeocoding(false)
        const L2 = mapRef.current?._L
        if (!L2) return
        const icon = (color: string, label: string) =>
          L2.divIcon({ className: "", html: pinHtml(color, label), iconSize: [28, 38], iconAnchor: [14, 38] })

        if (modeRef.current === "pickup") {
          pickupMkRef.current?.remove()
          pickupMkRef.current = L2.marker([lat, lng], { icon: icon("#22c55e", "P"), draggable: true }).addTo(mapRef.current)
          pickupMkRef.current.bindPopup(`<b>Your pickup</b><br><small>${name}</small>`).openPopup()
          pickupMkRef.current.on("dragend", async (ev: any) => {
            const p = ev.target.getLatLng()
            const n = await reverseGeocode(p.lat, p.lng)
            onPickup(p.lat, p.lng, n)
            setPickupSet(true)
          })
          onPickup(lat, lng, name)
          setPickupSet(true)
          setMode("dropoff"); modeRef.current = "dropoff"
        } else {
          dropoffMkRef.current?.remove()
          dropoffMkRef.current = L2.marker([lat, lng], { icon: icon("#ef4444", "D"), draggable: true }).addTo(mapRef.current)
          dropoffMkRef.current.bindPopup(`<b>Your drop-off</b><br><small>${name}</small>`).openPopup()
          dropoffMkRef.current.on("dragend", async (ev: any) => {
            const p = ev.target.getLatLng()
            const n = await reverseGeocode(p.lat, p.lng)
            onDropoff(p.lat, p.lng, n)
            setDropoffSet(true)
          })
          onDropoff(lat, lng, name)
          setDropoffSet(true)
        }
      })

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

  function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        mapRef.current?.setView([lat, lng], 14)
        setGeocoding(true)
        const name = await reverseGeocode(lat, lng)
        setGeocoding(false)
        const L = mapRef.current?._L
        if (L && mapRef.current) {
          const icon = L.divIcon({ className: "", html: pinHtml("#22c55e", "P"), iconSize: [28, 38], iconAnchor: [14, 38] })
          pickupMkRef.current?.remove()
          pickupMkRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(mapRef.current)
          pickupMkRef.current.on("dragend", async (ev: any) => {
            const p = ev.target.getLatLng()
            const n = await reverseGeocode(p.lat, p.lng)
            onPickup(p.lat, p.lng, n)
          })
        }
        onPickup(lat, lng, name)
        setPickupSet(true)
        setMode("dropoff"); modeRef.current = "dropoff"
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10000 }
    )
  }

  return (
    <div className="space-y-2 mt-3">
      {/* Mode buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMode("pickup")}
          className={`relative flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
            mode === "pickup"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
              : "border-border text-muted-foreground hover:border-emerald-300"
          }`}
        >
          {pickupSet && <span className="absolute top-1.5 right-2 text-emerald-500 text-[10px]">✓</span>}
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${
            mode === "pickup" ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40 text-muted-foreground"
          }`}>P</div>
          <div className="text-left">
            <p className="font-semibold text-xs">Set Pickup</p>
            <p className="text-[10px] font-normal text-muted-foreground">Click map to pin</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setMode("dropoff")}
          className={`relative flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
            mode === "dropoff"
              ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              : "border-border text-muted-foreground hover:border-red-300"
          }`}
        >
          {dropoffSet && <span className="absolute top-1.5 right-2 text-red-500 text-[10px]">✓</span>}
          <div className={`h-7 w-7 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0 ${
            mode === "dropoff" ? "border-red-500 bg-red-500 text-white" : "border-muted-foreground/40 text-muted-foreground"
          }`}>D</div>
          <div className="text-left">
            <p className="font-semibold text-xs">Set Drop-off</p>
            <p className="text-[10px] font-normal text-muted-foreground">Click map to pin</p>
          </div>
        </button>
      </div>

      {/* Active hint */}
      <div className={`text-xs px-3 py-2 rounded-lg flex items-center gap-2 ${
        mode === "pickup"
          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
          : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
      }`}>
        <div className={`h-2 w-2 rounded-full shrink-0 ${mode === "pickup" ? "bg-emerald-500" : "bg-red-500"}`} />
        {mode === "pickup" ? "Click anywhere on the map to pin your pickup location" : "Now click to pin your drop-off location"}
        {geocoding && <Loader2 className="h-3 w-3 animate-spin ml-auto shrink-0" />}
      </div>

      {/* Use my location */}
      <button
        type="button"
        onClick={useMyLocation}
        disabled={locating}
        className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-60 transition-all"
      >
        {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Navigation className="h-3.5 w-3.5" />}
        Use my current location as pickup
      </button>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: 380 }}>
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Pickup (P) — drag to adjust</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" />Drop-off (D) — drag to adjust</span>
      </div>
    </div>
  )
}
