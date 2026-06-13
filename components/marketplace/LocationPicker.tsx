"use client"
import { useEffect, useRef, useState, useCallback } from "react"
import { MapPin, Loader2, LocateFixed, Search, Check, X } from "lucide-react"

export interface PickedLocation {
  lat: number
  lng: number
  area?: string
}

interface Props {
  value: PickedLocation | null
  onChange: (loc: PickedLocation | null) => void
}

export function LocationPicker({ value, onChange }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef        = useRef<any>(null)
  const searchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [locating,  setLocating]  = useState(false)
  const [area,      setArea]      = useState(value?.area ?? "")
  const [center,    setCenter]    = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.lat, lng: value.lng } : null
  )
  const [confirmed, setConfirmed] = useState(!!value)
  const [dragging,  setDragging]  = useState(false)

  const [searchQ,       setSearchQ]       = useState("")
  const [searching,     setSearching]     = useState(false)
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([])

  // ─── Reverse geocode map centre ──────────────────────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      )
      const data = await res.json()
      const a    = data.address ?? {}
      const name =
        a.suburb ?? a.neighbourhood ?? a.city_district ??
        a.town   ?? a.city          ?? data.display_name?.split(",")[0] ?? ""
      setArea(name)
    } catch { /* ignore */ }
  }, [])

  // ─── Fly map to coords ───────────────────────────────────────────────────
  const flyTo = useCallback((lat: number, lng: number, zoom = 16) => {
    mapRef.current?.flyTo([lat, lng], zoom, { duration: 1 })
  }, [])

  // ─── Use my location ─────────────────────────────────────────────────────
  const handleMyLocation = useCallback(() => {
    if (!navigator?.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocating(false); flyTo(pos.coords.latitude, pos.coords.longitude, 16) },
      ()    => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [flyTo])

  // ─── Search autocomplete ─────────────────────────────────────────────────
  const handleSearch = useCallback((q: string) => {
    setSearchQ(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (q.length < 3) { setSearchResults([]); return }
    searchTimer.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res  = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=4&countrycodes=in`,
          { headers: { "Accept-Language": "en" } }
        )
        setSearchResults(await res.json())
      } catch { setSearchResults([]) }
      finally   { setSearching(false) }
    }, 350)
  }, [])

  // ─── Confirm selection ───────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    if (!center) return
    onChange({ ...center, area })
    setConfirmed(true)
  }, [center, area, onChange])

  // ─── Init Leaflet once ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    import("leaflet").then((L) => {
      if (!containerRef.current || mapRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl

      const initCenter: [number, number] = value
        ? [value.lat, value.lng]
        : [20.5937, 78.9629]

      const map = L.map(containerRef.current, {
        center: initCenter,
        zoom: value ? 15 : 5,
        zoomControl: false,
        attributionControl: false,
      })

      // CartoDB Voyager — clean, colourful, Google Maps-like
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        { maxZoom: 19 }
      ).addTo(map)

      // Zoom bottom-right
      L.control.zoom({ position: "bottomright" }).addTo(map)

      // Attribution
      L.control.attribution({ position: "bottomleft", prefix: "" })
        .addAttribution('&copy; <a href="https://carto.com">CARTO</a>')
        .addTo(map)

      map.on("movestart", () => { setDragging(true);  setConfirmed(false) })
      map.on("moveend",   () => {
        setDragging(false)
        const c = map.getCenter()
        setCenter({ lat: c.lat, lng: c.lng })
        reverseGeocode(c.lat, c.lng)
      })

      mapRef.current = map

      if (!value) setTimeout(handleMyLocation, 400)
    })

    return () => { mapRef.current?.remove(); mapRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-2">
      {/* ── Map shell ──────────────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl overflow-hidden border border-border shadow-sm"
        style={{ height: 380 }}
      >
        {/* Leaflet canvas */}
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />

        {/* Search bar */}
        <div className="absolute top-3 left-3 right-14 z-[1000]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              value={searchQ}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search area or landmark…"
              className="w-full h-10 pl-9 pr-8 bg-card/95 backdrop-blur-sm shadow-md border border-border/30 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400/40"
            />
            {searching
              ? <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              : searchQ && (
                <button type="button" onClick={() => { setSearchQ(""); setSearchResults([]) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
          </div>

          {/* Autocomplete dropdown */}
          {searchResults.length > 0 && (
            <div className="mt-1 bg-card rounded-xl shadow-xl border border-border/60 overflow-hidden">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    flyTo(parseFloat(r.lat), parseFloat(r.lon), 16)
                    setSearchQ("")
                    setSearchResults([])
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted flex items-start gap-2.5 border-b border-border/40 last:border-0"
                >
                  <MapPin className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-snug">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* My location button */}
        <button
          type="button"
          onClick={handleMyLocation}
          disabled={locating}
          title="Use my location"
          className="absolute top-3 right-3 z-[1000] h-10 w-10 bg-card/95 backdrop-blur-sm shadow-md rounded-xl flex items-center justify-center hover:bg-card transition-colors disabled:opacity-60 border border-border/40"
        >
          {locating
            ? <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
            : <LocateFixed className="h-4 w-4 text-primary-600" />}
        </button>

        {/* Fixed centre pin — stays in place while map drags */}
        <div className="absolute inset-0 pointer-events-none z-[999] flex items-center justify-center">
          <div className={`flex flex-col items-center transition-transform duration-150 ${dragging ? "-translate-y-3" : "-translate-y-4"}`}>
            <svg width="36" height="44" viewBox="0 0 36 44" fill="none" className="drop-shadow-lg">
              <path
                d="M18 0C8.059 0 0 8.059 0 18c0 12.75 18 26 18 26S36 30.75 36 18C36 8.059 27.941 0 18 0z"
                fill="#3B5BDB"
              />
              <circle cx="18" cy="18" r="7" fill="white" />
              <circle cx="18" cy="18" r="4" fill="#3B5BDB" />
            </svg>
            {/* Shadow dot on the map surface */}
            <div className={`h-1.5 w-5 bg-black/25 rounded-full blur-[2px] transition-all duration-150 ${dragging ? "scale-75 opacity-50" : "scale-100 opacity-100"}`} />
          </div>
        </div>

        {/* Bottom address + confirm card */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] p-3">
          <div className="bg-card/95 backdrop-blur-sm rounded-2xl shadow-xl border border-border/30 px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              {area ? (
                <>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {dragging ? "Moving…" : "Selected location"}
                  </p>
                  <p className="text-sm font-semibold truncate mt-0.5 text-foreground">{area}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {locating ? "Finding your location…" : "Move the map to pick your spot"}
                </p>
              )}
            </div>

            {confirmed ? (
              <div className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">
                <Check className="h-4 w-4" /> Confirmed
              </div>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!center || !area}
                className="shrink-0 px-4 py-2 rounded-xl text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Confirm
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Below-map hint / clear */}
      {value && (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary-600 shrink-0" />
          <span className="text-foreground font-medium">{value.area}</span>
          <button
            type="button"
            onClick={() => { onChange(null); setConfirmed(false); setArea(""); setCenter(null) }}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500"
          >
            <X className="h-3.5 w-3.5" /> Clear
          </button>
        </div>
      )}
    </div>
  )
}
