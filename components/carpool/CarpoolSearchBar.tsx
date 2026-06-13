"use client"

import { useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import { Search, MapPin, X, Loader2, ArrowRight, Map, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const CarpoolSearchMap = dynamic(
  () => import("./CarpoolSearchMap").then((m) => m.CarpoolSearchMap),
  { ssr: false, loading: () => <div className="h-[380px] mt-3 rounded-2xl bg-muted animate-pulse border border-border" /> }
)

interface Suggestion { lat: number; lng: number; name: string }

async function fetchSuggestions(q: string, nearLat?: number, nearLng?: number): Promise<Suggestion[]> {
  if (q.trim().length < 2) return []
  try {
    let url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1&countrycodes=in`
    if (nearLat && nearLng) {
      const d = 0.7
      url += `&viewbox=${nearLng - d},${nearLat - d},${nearLng + d},${nearLat + d}&bounded=0`
    }
    const res  = await fetch(url, { headers: { "User-Agent": "KorpoApp/1.0" } })
    const data = await res.json()
    return data.map((r: any) => ({
      lat:  parseFloat(r.lat),
      lng:  parseFloat(r.lon),
      name: r.display_name.split(", ").slice(0, 3).join(", "),
    }))
  } catch { return [] }
}

function LocationInput({
  label, color, value, onChange, onSelect, placeholder, nearLat, nearLng,
}: {
  label:       string
  color:       "emerald" | "red"
  value:       string
  onChange:    (v: string) => void
  onSelect:    (s: Suggestion) => void
  placeholder: string
  nearLat?:    number
  nearLng?:    number
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open,        setOpen]        = useState(false)
  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(v: string) {
    onChange(v)
    setOpen(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSuggestions(v, nearLat, nearLng)
      setSuggestions(results)
    }, 300)
  }

  function handleSelect(s: Suggestion) {
    onSelect(s)
    setSuggestions([])
    setOpen(false)
  }

  function handleClear() {
    onChange("")
    onSelect({ lat: 0, lng: 0, name: "" })
    setSuggestions([])
  }

  return (
    <div className="relative flex-1 min-w-0">
      <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1 ml-1">{label}</label>
      <div className="relative">
        <div className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full shrink-0",
          color === "emerald" ? "bg-emerald-500" : "bg-red-500"
        )} />
        <input
          type="text"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setOpen(true) }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full text-sm pl-8 pr-8 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
        {value && (
          <button type="button" onClick={handleClear} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              type="button"
              onMouseDown={() => handleSelect(s)}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-muted transition-colors border-b border-border/50 last:border-0"
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-sm leading-snug line-clamp-2">{s.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap",
        active
          ? "bg-primary-600 border-primary-600 text-white"
          : "border-border bg-background text-muted-foreground hover:border-foreground/30 hover:text-foreground"
      )}
    >
      {label}
    </button>
  )
}

const TIME_OPTIONS = [
  { value: "morning",   label: "Morning",   sub: "5 am – 12 pm" },
  { value: "afternoon", label: "Afternoon", sub: "12 pm – 5 pm"  },
  { value: "evening",   label: "Evening",   sub: "5 pm – 10 pm"  },
]

const FREQ_OPTIONS = [
  { value: "WEEKDAYS", label: "Mon – Fri"  },
  { value: "DAILY",    label: "Daily"      },
  { value: "WEEKENDS", label: "Weekends"   },
  { value: "WEEKLY",   label: "Weekly"     },
  { value: "ONCE",     label: "One-time"   },
]

const VEHICLE_OPTIONS = ["Hatchback", "Sedan", "SUV", "MUV / Van", "Electric", "Bike"]

export function CarpoolSearchBar() {
  const router = useRouter()
  const params = useSearchParams()

  // Location state
  const [from,    setFrom]    = useState(params.get("from")    ?? "")
  const [to,      setTo]      = useState(params.get("to")      ?? "")
  const [fromLat, setFromLat] = useState(params.get("fromLat") ? parseFloat(params.get("fromLat")!) : 0)
  const [fromLng, setFromLng] = useState(params.get("fromLng") ? parseFloat(params.get("fromLng")!) : 0)
  const [toLat,   setToLat]   = useState(params.get("toLat")   ? parseFloat(params.get("toLat")!)   : 0)
  const [toLng,   setToLng]   = useState(params.get("toLng")   ? parseFloat(params.get("toLng")!)   : 0)

  // Filter state — initialised from URL so they survive page reload
  const [timeOfDay,     setTimeOfDay]     = useState(params.get("time") ?? "")
  const [freqFilter,    setFreqFilter]    = useState<string[]>(params.get("freq")?.split(",").filter(Boolean) ?? [])
  const [vehicleFilter, setVehicleFilter] = useState<string[]>(params.get("vehicle")?.split(",").filter(Boolean) ?? [])
  const [acOnly,        setAcOnly]        = useState(params.get("ac") === "1")
  const [maxPrice,      setMaxPrice]      = useState(params.get("maxPrice") ?? "")

  // UI toggles — auto-open filter panel when URL already has filter params
  const [locating,    setLocating]    = useState(false)
  const [showMap,     setShowMap]     = useState(false)
  const [showFilters, setShowFilters] = useState(
    !!(params.get("time") || params.get("freq") || params.get("vehicle") || params.get("ac") || params.get("maxPrice"))
  )

  function toggleFreq(v: string) {
    setFreqFilter((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])
  }
  function toggleVehicle(v: string) {
    setVehicleFilter((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])
  }

  function handleFromSelect(s: Suggestion) { setFrom(s.name); setFromLat(s.lat); setFromLng(s.lng) }
  function handleToSelect(s: Suggestion)   { setTo(s.name);   setToLat(s.lat);   setToLng(s.lng)   }
  function handleMapPickup(lat: number, lng: number, name: string)  { setFrom(name); setFromLat(lat); setFromLng(lng) }
  function handleMapDropoff(lat: number, lng: number, name: string) { setTo(name);   setToLat(lat);   setToLng(lng)  }

  const hasLocationFilter = fromLat !== 0 && toLat !== 0
  const hasActiveFilters  = !!(timeOfDay || freqFilter.length || vehicleFilter.length || acOnly || maxPrice)
  const activeFilterCount =
    (timeOfDay ? 1 : 0) +
    (freqFilter.length    > 0 ? 1 : 0) +
    (vehicleFilter.length > 0 ? 1 : 0) +
    (acOnly    ? 1 : 0) +
    (maxPrice  ? 1 : 0)
  const canSearch = hasLocationFilter || hasActiveFilters

  function handleSearch() {
    const q: Record<string, string> = {}
    if (fromLat && toLat) {
      q.from = from; q.fromLat = String(fromLat); q.fromLng = String(fromLng)
      q.to   = to;   q.toLat   = String(toLat);   q.toLng   = String(toLng)
    }
    if (timeOfDay)                 q.time    = timeOfDay
    if (freqFilter.length > 0)    q.freq     = freqFilter.join(",")
    if (vehicleFilter.length > 0) q.vehicle  = vehicleFilter.join(",")
    if (acOnly)                   q.ac       = "1"
    if (maxPrice)                 q.maxPrice = maxPrice
    router.push(`/carpool?${new URLSearchParams(q)}`)
  }

  function handleClearFilters() {
    setTimeOfDay(""); setFreqFilter([]); setVehicleFilter([]); setAcOnly(false); setMaxPrice("")
  }

  function handleClear() {
    setFrom(""); setTo(""); setFromLat(0); setFromLng(0); setToLat(0); setToLng(0)
    handleClearFilters()
    router.push("/carpool")
  }

  const isSearchActive = !!(
    params.get("fromLat") || params.get("time") || params.get("freq") ||
    params.get("vehicle") || params.get("ac")   || params.get("maxPrice")
  )

  async function useMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { "User-Agent": "KorpoApp/1.0" } })
          const data = await res.json()
          const a    = data.address ?? {}
          const name = [a.suburb ?? a.neighbourhood ?? a.village ?? "", a.city ?? a.state_district ?? ""].filter(Boolean).join(", ")
            || data.display_name?.split(",").slice(0, 2).join(", ")
          setFrom(name); setFromLat(lat); setFromLng(lng)
        } catch {}
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Search className="h-4 w-4 text-primary-600" />
        <p className="font-semibold text-sm">Find rides on your route</p>
        {isSearchActive && (
          <button onClick={handleClear} className="ml-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <X className="h-3 w-3" /> Clear all
          </button>
        )}
      </div>

      {/* Location inputs */}
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <LocationInput
          label="Your pickup"
          color="emerald"
          value={from}
          onChange={(v) => { setFrom(v); setFromLat(0); setFromLng(0) }}
          onSelect={handleFromSelect}
          placeholder="Where will you board?"
          nearLat={toLat || undefined}
          nearLng={toLng || undefined}
        />
        <div className="hidden sm:flex items-center justify-center self-end pb-2.5 shrink-0">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <LocationInput
          label="Your drop-off"
          color="red"
          value={to}
          onChange={(v) => { setTo(v); setToLat(0); setToLng(0) }}
          onSelect={handleToSelect}
          placeholder="Where do you need to go?"
          nearLat={fromLat || undefined}
          nearLng={fromLng || undefined}
        />
        <div className="flex gap-2 shrink-0 self-end">
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="text-xs px-3 py-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-60 transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            {locating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
            My location
          </button>
          <Button onClick={handleSearch} disabled={!canSearch} className="px-5">
            <Search className="h-4 w-4 mr-1.5" /> Search
          </Button>
        </div>
      </div>

      {!hasLocationFilter && (from || to) && (
        <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0" />
          Pick a location from the suggestions or pin it on the map
        </p>
      )}

      {/* Toolbar row */}
      <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all",
            showFilters || hasActiveFilters
              ? "border-primary-400 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300"
              : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-primary-600 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        <button
          type="button"
          onClick={() => setShowMap((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all",
            showMap
              ? "border-primary-400 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300"
              : "border-border text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground"
          )}
        >
          <Map className="h-3.5 w-3.5" />
          {showMap ? "Hide map" : "Pin on map"}
        </button>
      </div>

      {/* ── Filter panel ── */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-border space-y-5">

          {/* Departure time — single-select */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Departure time</p>
            <div className="flex flex-wrap gap-2">
              {TIME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setTimeOfDay(timeOfDay === opt.value ? "" : opt.value)}
                  className={cn(
                    "flex flex-col items-center px-5 py-2.5 rounded-xl border text-xs font-medium transition-all",
                    timeOfDay === opt.value
                      ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-violet-300 hover:text-foreground"
                  )}
                >
                  <span className="font-semibold">{opt.label}</span>
                  <span className={cn("text-[10px] mt-0.5", timeOfDay === opt.value ? "text-violet-200" : "text-muted-foreground")}>
                    {opt.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Frequency / days — multi-select */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Days / frequency</p>
            <div className="flex flex-wrap gap-2">
              {FREQ_OPTIONS.map((opt) => (
                <Chip key={opt.value} label={opt.label} active={freqFilter.includes(opt.value)} onClick={() => toggleFreq(opt.value)} />
              ))}
            </div>
          </div>

          {/* Vehicle type — multi-select */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Vehicle type</p>
            <div className="flex flex-wrap gap-2">
              {VEHICLE_OPTIONS.map((v) => (
                <Chip key={v} label={v} active={vehicleFilter.includes(v)} onClick={() => toggleVehicle(v)} />
              ))}
            </div>
          </div>

          {/* AC + Price */}
          <div className="flex flex-wrap items-end gap-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Comfort</p>
              <button
                type="button"
                onClick={() => setAcOnly((v) => !v)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-medium transition-all",
                  acOnly
                    ? "bg-sky-600 border-sky-600 text-white shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-sky-300 hover:text-foreground"
                )}
              >
                ❄️ AC only
              </button>
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">Max price / seat</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">₹</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  min={0}
                  className="w-28 text-sm pl-7 pr-3 py-2 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 pb-0.5 transition-colors"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      {showMap && (
        <CarpoolSearchMap
          onPickup={handleMapPickup}
          onDropoff={handleMapDropoff}
          pickupLat={fromLat || undefined}
          pickupLng={fromLng || undefined}
          dropoffLat={toLat || undefined}
          dropoffLng={toLng || undefined}
        />
      )}
    </div>
  )
}
