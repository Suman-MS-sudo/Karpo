"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { Search, MapPin, Loader2, LocateFixed, X } from "lucide-react"

interface Props {
  latitude?: number
  longitude?: number
  cityHint?: string
  onSelect: (lat: number, lng: number, address: string) => void
}

const CITY_COORDS: Record<string, [number, number]> = {
  "Bangalore":  [12.9716, 77.5946],
  "Mumbai":     [19.0760, 72.8777],
  "Delhi":      [28.6139, 77.2090],
  "Hyderabad":  [17.3850, 78.4867],
  "Chennai":    [13.0827, 80.2707],
  "Pune":       [18.5204, 73.8567],
  "Kolkata":    [22.5726, 88.3639],
  "Ahmedabad":  [23.0225, 72.5714],
  "Jaipur":     [26.9124, 75.7873],
  "Surat":      [21.1702, 72.8311],
  "Noida":      [28.5355, 77.3910],
  "Gurgaon":    [28.4595, 77.0266],
  "Chandigarh": [30.7333, 76.7794],
  "Kochi":      [9.9312,  76.2673],
}

const PIN_STYLE = `
@keyframes pin-drop{0%{transform:translateY(-20px) scale(0.75);opacity:0}65%{transform:translateY(5px) scale(1.08)}100%{transform:translateY(0) scale(1);opacity:1}}
@keyframes pin-ring{0%{transform:translateX(-50%) scale(0.5);opacity:0.8}100%{transform:translateX(-50%) scale(2.5);opacity:0}}
.lf-pin{animation:pin-drop 0.38s cubic-bezier(0.34,1.56,0.64,1) both}
.lf-ring{position:absolute;bottom:-6px;left:50%;width:20px;height:20px;border-radius:50%;background:rgba(99,102,241,0.3);animation:pin-ring 1.4s ease-out infinite}
`

function makePinIcon(L: any, animate: boolean) {
  return L.divIcon({
    className: "",
    html: `<style>${PIN_STYLE}</style>
<div class="${animate ? "lf-pin" : ""}" style="position:relative;width:32px;height:44px;filter:drop-shadow(0 5px 10px rgba(79,70,229,0.5))">
  ${animate ? '<div class="lf-ring"></div>' : ""}
  <svg width="32" height="44" viewBox="0 0 32 44" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="pinG${animate ? "a" : "b"}" cx="38%" cy="32%" r="70%">
        <stop offset="0%" stop-color="#a5b4fc"/>
        <stop offset="100%" stop-color="#4338ca"/>
      </radialGradient>
    </defs>
    <path d="M16 0C7.16 0 0 7.16 0 16c0 10.2 16 28 16 28S32 26.2 32 16C32 7.16 24.84 0 16 0z"
          fill="url(#pinG${animate ? "a" : "b"})"/>
    <circle cx="16" cy="15.5" r="8" fill="white" opacity="0.9"/>
    <circle cx="16" cy="15.5" r="4" fill="#4338ca"/>
  </svg>
</div>`,
    iconSize:   [32, 44],
    iconAnchor: [16, 44],
    popupAnchor:[0, -44],
  })
}

export function MapPicker({ latitude, longitude, cityHint, onSelect }: Props) {
  const containerRef     = useRef<HTMLDivElement>(null)
  const mapRef           = useRef<any>(null)
  const markerRef        = useRef<any>(null)
  const tileRef          = useRef<any>(null)

  const [query, setQuery]             = useState("")
  const [searching, setSearching]     = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [pinAddress, setPinAddress]   = useState("")
  const [pinCoords, setPinCoords]     = useState<[number,number]|null>(
    latitude && longitude ? [latitude, longitude] : null
  )
  const [locating, setLocating] = useState(false)

  const isDark = () =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")

  const tileUrl = (dark: boolean) =>
    dark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"

  const placeMarker = useCallback((L: any, lat: number, lng: number, animate = false) => {
    if (markerRef.current) markerRef.current.remove()
    markerRef.current = L.marker([lat, lng], { icon: makePinIcon(L, animate) }).addTo(mapRef.current)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return

    let map: any = null
    let observer: MutationObserver | null = null

    import("leaflet").then((L) => {
      // Guard against double-init (React Strict Mode runs effects twice in dev)
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) return

      const center: [number, number] =
        latitude && longitude             ? [latitude, longitude] :
        cityHint && CITY_COORDS[cityHint] ? CITY_COORDS[cityHint] :
        [20.5937, 78.9629]

      map = L.map(containerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView(center, latitude && longitude ? 16 : 13)

      L.control.zoom({ position: "bottomright" }).addTo(map)
      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map)

      tileRef.current = L.tileLayer(tileUrl(isDark()), {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map)

      if (latitude && longitude) placeMarker(L, latitude, longitude, false)

      map.on("click", async (e: any) => {
        const { lat, lng } = e.latlng
        placeMarker(L, lat, lng, true)
        setPinCoords([lat, lng])
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "Accept-Language": "en" } })
          const data = await res.json()
          const addr = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          setPinAddress(addr)
          onSelect(lat, lng, addr)
        } catch {
          const addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          setPinAddress(addr)
          onSelect(lat, lng, addr)
        }
      })

      mapRef.current = map

      observer = new MutationObserver(() => {
        tileRef.current?.setUrl(tileUrl(isDark()))
      })
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    })

    return () => {
      observer?.disconnect()
      // Remove map on unmount (also covers Strict Mode second cleanup)
      if (map) {
        map.remove()
        mapRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async () => {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setSuggestions([])
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=6&countrycodes=in`,
        { headers: { "Accept-Language": "en" } }
      )
      const data = await res.json()
      setSuggestions(data)
    } finally {
      setSearching(false)
    }
  }

  const selectSuggestion = (item: any) => {
    setSuggestions([])
    setQuery("")
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)
    mapRef.current?.setView([lat, lng], 17, { animate: true })
    import("leaflet").then((L) => placeMarker(L, lat, lng, true))
    setPinCoords([lat, lng])
    setPinAddress(item.display_name)
    onSelect(lat, lng, item.display_name)
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        mapRef.current?.setView([lat, lng], 17, { animate: true })
        import("leaflet").then((L) => placeMarker(L, lat, lng, true))
        setPinCoords([lat, lng])
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "Accept-Language": "en" } })
          const data = await res.json()
          const addr = data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
          setPinAddress(addr)
          onSelect(lat, lng, addr)
        } catch {
          onSelect(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
        }
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true }
    )
  }

  return (
    <div className="space-y-3">
      {/* Search row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSearch() } }}
            placeholder="Search building, society, street…"
            className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-input bg-background text-sm
                       placeholder:text-muted-foreground focus:outline-none focus:ring-2
                       focus:ring-indigo-500/40 focus:border-indigo-500 transition-colors"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setSuggestions([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-[9999] mt-1.5 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              {suggestions.map((s, i) => (
                <button key={i} type="button" onClick={() => selectSuggestion(s)}
                  className="w-full text-left px-4 py-3 text-sm hover:bg-muted flex items-start gap-3 border-b border-border/50 last:border-0 transition-colors group">
                  <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/60 transition-colors">
                    <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground line-clamp-1">{s.display_name.split(",")[0]}</p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{s.display_name.split(",").slice(1).join(",").trim()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="button" onClick={handleSearch} disabled={searching}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium
                     hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50
                     flex items-center gap-1.5 shrink-0 shadow-sm">
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>

        <button type="button" onClick={useMyLocation} disabled={locating}
          title="Use my location"
          className="px-3 py-2.5 rounded-xl border border-input bg-background hover:bg-muted
                     active:scale-95 transition-all disabled:opacity-50 shrink-0
                     text-muted-foreground hover:text-foreground">
          {locating ? <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> : <LocateFixed className="h-4 w-4" />}
        </button>
      </div>

      {/* Map canvas */}
      <div className="relative rounded-2xl overflow-hidden border border-border shadow-md" style={{ height: 320 }}>
        <div ref={containerRef} className="w-full h-full" />

        {!pinCoords && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="flex items-center gap-2 bg-black/65 text-white text-xs px-3.5 py-2 rounded-full backdrop-blur-md shadow-lg whitespace-nowrap">
              <MapPin className="h-3.5 w-3.5 text-indigo-300" />
              Click on the map to pin your property
            </div>
          </div>
        )}

        {pinCoords && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/60 text-white text-[10px] px-2.5 py-1.5 rounded-xl backdrop-blur-md shadow font-mono">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
              {pinCoords[0].toFixed(4)}, {pinCoords[1].toFixed(4)}
            </div>
          </div>
        )}
      </div>

      {/* Pinned address */}
      {pinAddress && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
          <div className="h-7 w-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-0.5">Pinned Location</p>
            <p className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed">{pinAddress}</p>
          </div>
          <button type="button" onClick={() => { setPinAddress(""); setPinCoords(null); if (markerRef.current) { markerRef.current.remove(); markerRef.current = null } }}
            className="ml-auto text-indigo-400 hover:text-indigo-600 transition-colors shrink-0 mt-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}
