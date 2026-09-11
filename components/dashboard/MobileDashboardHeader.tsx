"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { MapPin, ChevronDown, LocateFixed, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { DashboardSearchBar } from "@/components/dashboard/DashboardSearchBar"
import { detectCityFromBrowser, matchCity, LocationPermissionDeniedError, getEnableLocationSteps } from "@/lib/geolocation"
import { CITIES } from "@/config/services"

interface Props {
  name?: string | null
  avatarUrl?: string | null
  city?: string | null
  greeting: string
}

export function MobileDashboardHeader({ name, avatarUrl, city, greeting }: Props) {
  const { update } = useSession()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState("")
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState("")
  const [locateDenied, setLocateDenied] = useState(false)

  async function selectCity(next: string) {
    if (!next.trim() || next === city) {
      setOpen(false)
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: next }),
      })
      if (!res.ok) {
        setError("Could not save your city. Please try again.")
        return
      }
      await update()
      window.location.reload()
    } catch {
      setError("Could not save your city. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  async function useCurrentLocation() {
    setLocating(true)
    setError("")
    setLocateDenied(false)
    try {
      const detected = await detectCityFromBrowser()
      const matched = matchCity(detected, CITIES)
      setPicked(matched)
      await selectCity(matched)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get your location.")
      setLocateDenied(err instanceof LocationPermissionDeniedError)
    } finally {
      setLocating(false)
    }
  }

  return (
    <div
      className="sticky top-0 z-40 text-white px-4 pt-4 pb-4 bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: "url(/dashboard-header-bg.svg)" }}
    >
      {/* Color wash over the artwork — keeps the greeting/city/search text
          legible at every scroll position without flattening the image out. */}
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/80 via-indigo-600/70 to-indigo-500/80" aria-hidden />

      <div className="relative flex items-center gap-3 mb-3">
        <button
          type="button"
          onClick={() => { setOpen(true); setPicked(city ?? "") }}
          className="flex items-center gap-1.5 min-w-0"
        >
          <div className="min-w-0 text-left">
            <p className="text-[11px] font-medium text-white/70 leading-tight">{greeting}</p>
            <p className="flex items-center gap-1 text-sm font-bold truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{city ?? "Set your city"}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </p>
          </div>
        </button>
      </div>

      <div className="relative">
        <DashboardSearchBar variant="light" />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-foreground"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h2 className="text-base font-semibold">Change your city</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                disabled={saving}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full mb-3"
              onClick={useCurrentLocation}
              disabled={locating || saving}
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="h-4 w-4" />
              )}
              Use my current location
            </Button>

            <CityAutocomplete value={picked} onChange={setPicked} placeholder="Search your city…" />

            {error && (
              <div className="mt-2">
                <p className="text-xs text-red-600">{error}</p>
                {locateDenied && (
                  <p className="text-xs text-muted-foreground mt-1">{getEnableLocationSteps()}</p>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="flex-1"
                disabled={!picked.trim() || saving || locating}
                onClick={() => selectCity(picked.trim())}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
