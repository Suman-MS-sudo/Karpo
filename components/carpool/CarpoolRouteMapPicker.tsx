"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Search, X, Loader2, Navigation, MapPin } from "lucide-react"

export interface Stop {
  name: string
  lat:  number
  lng:  number
}

export interface RouteData {
  fromLocation: string
  fromLat:      number
  fromLng:      number
  toLocation:   string
  toLat:        number
  toLng:        number
  stops:        Stop[]
}

interface Props {
  onChange: (data: Partial<RouteData>) => void
  initialData?: Partial<RouteData>
}

type Mode = "from" | "to"

// ─── Nominatim helpers ────────────────────────────────────────────────────────
interface NominatimResult { lat: string; lon: string; display_name: string; address?: Record<string, string> }

function shortName(r: NominatimResult) {
  const parts = r.display_name.split(", ")
  return parts.slice(0, 3).join(", ")
}

async function geocode(q: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&addressdetails=0`,
      { headers: { "User-Agent": "KorpoApp/1.0" } }
    )
    const data: NominatimResult[] = await res.json()
    if (!data[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: shortName(data[0]) }
  } catch { return null }
}

async function autocomplete(
  q: string,
  nearLat?: number,
  nearLng?: number,
): Promise<{ lat: number; lng: number; name: string; full: string }[]> {
  if (q.trim().length < 2) return []
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&addressdetails=1&countrycodes=in`
    if (nearLat && nearLng) {
      // 80 km bounding box around user — biases but doesn't restrict
      const d = 0.7
      url += `&viewbox=${nearLng - d},${nearLat - d},${nearLng + d},${nearLat + d}&bounded=0`
    }
    const res  = await fetch(url, { headers: { "User-Agent": "KorpoApp/1.0" } })
    const data: NominatimResult[] = await res.json()
    return data.map((r) => ({
      lat:  parseFloat(r.lat),
      lng:  parseFloat(r.lon),
      name: shortName(r),
      full: r.display_name,
    }))
  } catch { return [] }
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res  = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&zoom=18`,
      { headers: { "User-Agent": "KorpoApp/1.0" } }
    )
    const data = await res.json()
    const a    = data.address ?? {}
    const parts = [
      a.amenity ?? a.shop ?? a.building ?? a.house_name,
      [a.house_number, a.road].filter(Boolean).join(" ") || a.road,
      a.suburb ?? a.neighbourhood ?? a.village ?? a.town,
      a.city ?? a.state_district,
    ].filter(Boolean)
    return parts.slice(0, 4).join(", ") || data.display_name?.split(",").slice(0, 3).join(", ") || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
}

// ─── OSRM route ───────────────────────────────────────────────────────────────
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
    // OSRM returns [lng, lat], Leaflet needs [lat, lng]
    return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng] as [number, number])
  } catch { return [] }
}

// ─── SVG pin factories ────────────────────────────────────────────────────────
function pinHtml(color: string, label?: string) {
  return `<div style="position:relative;width:28px;height:38px;filter:drop-shadow(0 3px 6px rgba(0,0,0,.3))">
    <svg width="28" height="38" viewBox="0 0 28 38" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 8.94 14 24 14 24S28 22.94 28 14C28 6.27 21.73 0 14 0z" fill="${color}"/>
      <circle cx="14" cy="13.5" r="7" fill="white" opacity="0.9"/>
      ${label ? `<text x="14" y="18" text-anchor="middle" font-size="8" font-weight="bold" fill="${color}">${label}</text>` : `<circle cx="14" cy="13.5" r="3.5" fill="${color}"/>`}
    </svg>
  </div>`
}

const isDark = () => typeof document !== "undefined" && document.documentElement.classList.contains("dark")
const tileUrl = (dark: boolean) => dark
  ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
  : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

// ─── Component ────────────────────────────────────────────────────────────────
export function CarpoolRouteMapPicker({ onChange, initialData }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<any>(null)
  const layersRef     = useRef<{ from?: any; to?: any; route?: any; userDot?: any }>({})

  const [from,    setFrom]    = useState<Stop | null>(initialData?.fromLat ? { name: initialData.fromLocation!, lat: initialData.fromLat!, lng: initialData.fromLng! } : null)
  const [to,      setTo]      = useState<Stop | null>(initialData?.toLat   ? { name: initialData.toLocation!,   lat: initialData.toLat!,   lng: initialData.toLng!   } : null)
  const [mode,    setMode]    = useState<Mode>(initialData?.fromLat ? "to" : "from")
  const [routing, setRouting] = useState(false)
  const [searchFrom,  setSearchFrom]  = useState(initialData?.fromLocation ?? "")
  const [searchTo,    setSearchTo]    = useState(initialData?.toLocation   ?? "")
  const [searching,   setSearching]   = useState<"from" | "to" | null>(null)
  const [geoLoading,  setGeoLoading]  = useState(false)
  const [geoError,    setGeoError]    = useState("")

  // Autocomplete
  const [suggestions,    setSuggestions]    = useState<{ lat: number; lng: number; name: string; full: string }[]>([])
  const [suggestFor,     setSuggestFor]     = useState<"from" | "to" | null>(null)
  const [userPos,        setUserPos]        = useState<{ lat: number; lng: number } | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestBoxRef = useRef<HTMLDivElement>(null)

  // Refs so the map's click handler (attached once, on mount) always reads
  // the latest values without needing to be re-attached on every state change.
  const fromRef = useRef(from)
  const toRef   = useRef(to)
  const modeRef = useRef(mode)
  useEffect(() => { fromRef.current = from }, [from])
  useEffect(() => { toRef.current = to }, [to])
  useEffect(() => { modeRef.current = mode }, [mode])

  // notify parent whenever anything changes
  const notify = useCallback((f: Stop | null, t: Stop | null) => {
    onChange({
      fromLocation: f?.name, fromLat: f?.lat, fromLng: f?.lng,
      toLocation:   t?.name, toLat:   t?.lat, toLng:   t?.lng,
      stops: [],
    })
  }, [onChange])

  // draw/update markers and route on the Leaflet map
  const redraw = useCallback(async (f: Stop | null, t: Stop | null) => {
    const L   = mapRef.current?._L
    const map = mapRef.current
    if (!L || !map) return

    const mkIcon = (color: string, label?: string) => L.divIcon({ className: "", html: pinHtml(color, label), iconSize: [28, 38], iconAnchor: [14, 38] })

    // From marker
    layersRef.current.from?.remove()
    if (f) {
      layersRef.current.from = L.marker([f.lat, f.lng], { icon: mkIcon("#22c55e") })
        .addTo(map).bindPopup(`<b>Pickup:</b> ${f.name}`)
    }

    // To marker
    layersRef.current.to?.remove()
    if (t) {
      layersRef.current.to = L.marker([t.lat, t.lng], { icon: mkIcon("#ef4444") })
        .addTo(map).bindPopup(`<b>Drop-off:</b> ${t.name}`)
    }

    // Route polyline
    layersRef.current.route?.remove()
    if (f && t) {
      setRouting(true)
      const coords = await fetchRoute([f, t])
      setRouting(false)
      if (coords.length > 0) {
        layersRef.current.route = L.polyline(coords, { color: "#3b82f6", weight: 4, opacity: 0.8 }).addTo(map)
      } else {
        // fallback: straight line
        layersRef.current.route = L.polyline([[f.lat, f.lng], [t.lat, t.lng]], { color: "#3b82f6", weight: 3, opacity: 0.6, dashArray: "6 4" }).addTo(map)
      }
      map.fitBounds(L.latLngBounds([[f.lat, f.lng], [t.lat, t.lng]]).pad(0.15))
    } else if (f) {
      map.setView([f.lat, f.lng], 14)
    } else if (t) {
      map.setView([t.lat, t.lng], 14)
    }
  }, [])

  // Initialise map
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return
    let map: any = null
    let observer: MutationObserver | null = null

    import("leaflet").then((L) => {
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) return

      if (!document.querySelector("#leaflet-css")) {
        const link = document.createElement("link")
        link.id   = "leaflet-css"; link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      map = L.map(containerRef.current, { zoomControl: true, attributionControl: false })
        .setView([20.5937, 78.9629], 5) // India overview while locating

      L.tileLayer(tileUrl(isDark()), {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: "abcd", maxZoom: 19,
      }).addTo(map)

      map._L = L
      mapRef.current = map

      // ── Auto-locate on load ──────────────────────────────────────────────────
      if (navigator.geolocation && !initialData?.fromLat) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lng } = pos.coords
            setUserPos({ lat, lng })
            if (!mapRef.current) return
            mapRef.current.setView([lat, lng], 13)
            // Pulsing "you are here" dot
            const pulseHtml = `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 6px rgba(59,130,246,0.25)"></div>`
            const userIcon  = L.divIcon({ className: "", html: pulseHtml, iconSize: [16, 16], iconAnchor: [8, 8] })
            layersRef.current.userDot = L.marker([lat, lng], { icon: userIcon, zIndexOffset: -1 })
              .addTo(mapRef.current).bindPopup("You are here")
          },
          () => { /* denied — stay at India overview */ },
          { timeout: 8000 }
        )
      } else if (initialData?.fromLat && initialData?.toLat) {
        // Draw existing route immediately
        redraw(
          { name: initialData.fromLocation!, lat: initialData.fromLat!, lng: initialData.fromLng! },
          { name: initialData.toLocation!,   lat: initialData.toLat!,   lng: initialData.toLng!   },
        )
      }

      // Map clicks pin whichever point is active — same pattern as the rider search map.
      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        const name = await reverseGeocode(lat, lng)
        const pt   = { lat, lng, name }

        if (modeRef.current === "from") {
          setFrom(pt); setSearchFrom(name)
          redraw(pt, toRef.current); notify(pt, toRef.current)
          if (!toRef.current) { setMode("to"); modeRef.current = "to" }
        } else {
          setTo(pt); setSearchTo(name)
          redraw(fromRef.current, pt); notify(fromRef.current, pt)
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

  // Debounced autocomplete handler — editing the text invalidates whatever
  // was previously pinned, so the map resets until a fresh point is chosen.
  function handleInputChange(type: "from" | "to", value: string) {
    if (type === "from") {
      setSearchFrom(value)
      if (from && value !== from.name) { setFrom(null); redraw(null, to); notify(null, to) }
    } else {
      setSearchTo(value)
      if (to && value !== to.name) { setTo(null); redraw(from, null); notify(from, null) }
    }
    setSuggestFor(type)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      const results = await autocomplete(value, userPos?.lat, userPos?.lng)
      setSuggestions(results)
      setSuggestFor(type)
    }, 320)
  }

  function clearPoint(type: "from" | "to") {
    setSuggestions([]); setSuggestFor(null)
    if (type === "from") {
      setFrom(null); setSearchFrom("")
      redraw(null, to); notify(null, to)
    } else {
      setTo(null); setSearchTo("")
      redraw(from, null); notify(from, null)
    }
  }

  function pickSuggestion(type: "from" | "to", s: { lat: number; lng: number; name: string }) {
    const pt = { lat: s.lat, lng: s.lng, name: s.name }
    setSuggestions([]); setSuggestFor(null)
    if (type === "from") {
      setFrom(pt); setSearchFrom(pt.name)
      redraw(pt, to); notify(pt, to)
      mapRef.current?.setView([pt.lat, pt.lng], 14)
      if (mode === "from" && !to) setMode("to")
    } else {
      setTo(pt); setSearchTo(pt.name)
      redraw(from, pt); notify(from, pt)
      mapRef.current?.setView([pt.lat, pt.lng], 14)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (suggestBoxRef.current && !suggestBoxRef.current.contains(e.target as Node)) {
        setSuggestions([]); setSuggestFor(null)
      }
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  async function locateAndSetFrom() {
    if (!navigator.geolocation) { setGeoError("Geolocation not supported by your browser"); return }
    setGeoLoading(true); setGeoError("")
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUserPos({ lat, lng })
        const name = await reverseGeocode(lat, lng)
        const pt   = { lat, lng, name }
        setFrom(pt); setSearchFrom(name)
        if (!toRef.current) setMode("to")
        mapRef.current?.setView([lat, lng], 14)
        // Update or add user dot
        const L = mapRef.current?._L
        if (L && mapRef.current) {
          layersRef.current.userDot?.remove()
          const pulseHtml = `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 6px rgba(59,130,246,0.25)"></div>`
          layersRef.current.userDot = L.marker([lat, lng], {
            icon: L.divIcon({ className: "", html: pulseHtml, iconSize: [16, 16], iconAnchor: [8, 8] }),
            zIndexOffset: -1,
          }).addTo(mapRef.current).bindPopup("You are here")
        }
        redraw(pt, toRef.current)
        notify(pt, toRef.current)
        setGeoLoading(false)
      },
      () => { setGeoError("Location access denied — please enable it in browser settings"); setGeoLoading(false) },
      { timeout: 10000 }
    )
  }

  async function handleSearch(type: "from" | "to") {
    const q = type === "from" ? searchFrom : searchTo
    if (!q.trim()) return
    setSearching(type)
    const result = await geocode(q)
    setSearching(null)
    if (!result) return
    const pt = result
    if (type === "from") {
      setFrom(pt); setSearchFrom(pt.name)
      redraw(pt, to); notify(pt, to)
      if (mode === "from" && !to) setMode("to")
    } else {
      setTo(pt); setSearchTo(pt.name)
      redraw(from, pt); notify(from, pt)
    }
  }

  return (
    <div className="space-y-3">
      {/* Search row with autocomplete */}
      <div className="grid grid-cols-2 gap-3" ref={suggestBoxRef}>
        {(["from", "to"] as const).map((type) => (
          <div key={type} className="relative">
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full ${type === "from" ? "bg-emerald-500" : "bg-red-500"}`} />
            <input
              type="text"
              value={type === "from" ? searchFrom : searchTo}
              onChange={(e) => handleInputChange(type, e.target.value)}
              onFocus={() => {
                setMode(type)
                const val = type === "from" ? searchFrom : searchTo
                if (val.trim().length >= 2) handleInputChange(type, val)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") { setSuggestions([]); handleSearch(type) }
                if (e.key === "Escape") { setSuggestions([]); setSuggestFor(null) }
              }}
              placeholder={type === "from" ? "From location…" : "To location…"}
              className="w-full text-sm pl-7 pr-9 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              autoComplete="off"
            />
            {(type === "from" ? searchFrom : searchTo) ? (
              <button
                type="button"
                onClick={() => clearPoint(type)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { setSuggestions([]); handleSearch(type) }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {searching === type
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Search className="h-4 w-4" />}
              </button>
            )}

            {/* Suggestions dropdown */}
            {suggestFor === type && suggestions.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); pickSuggestion(type, s) }}
                    className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                  >
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm leading-snug line-clamp-2">{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Use my location */}
      <button
        type="button"
        onClick={locateAndSetFrom}
        disabled={geoLoading}
        className="w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-60 transition-all"
      >
        {geoLoading
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Locating you…</>
          : <><Navigation className="h-3.5 w-3.5" />Use my current location as origin</>}
      </button>

      {geoError && (
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
          {geoError}
        </p>
      )}

      {/* Mode toggle buttons — same click-to-pin pattern as rider search */}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setMode("from")}
          className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all ${
            mode === "from"
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300"
              : "border-border text-muted-foreground hover:border-emerald-300"
          }`}>
          Set Pickup
        </button>
        <button type="button" onClick={() => setMode("to")}
          className={`text-xs font-medium px-3 py-2 rounded-lg border transition-all ${
            mode === "to"
              ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300"
              : "border-border text-muted-foreground hover:border-red-300"
          }`}>
          Set Drop-off
        </button>
      </div>

      {/* Map hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <Navigation className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        {mode === "from" ? "Click anywhere on the map to pin your pickup point" : "Click anywhere on the map to pin your drop-off point"}
        {routing && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-border shadow-sm" style={{ height: 340 }}>
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Legend + current selection */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0" />Pickup</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500 shrink-0" />Drop-off</span>
        <span className="flex items-center gap-1.5"><span className="h-px w-5 bg-blue-500" />Route</span>
      </div>

      {/* Selected summary */}
      {from && to && (
        <div className="text-xs bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2 space-y-0.5">
          <p><span className="font-semibold text-emerald-600">From:</span> {from.name}</p>
          <p><span className="font-semibold text-red-500">To:</span> {to.name}</p>
        </div>
      )}
    </div>
  )
}
