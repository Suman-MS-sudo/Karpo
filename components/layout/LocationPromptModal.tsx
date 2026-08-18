"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MapPin, Loader2, LocateFixed } from "lucide-react"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { Button } from "@/components/ui/button"
import { detectCityFromBrowser, matchCity } from "@/lib/geolocation"
import { CITIES } from "@/config/services"

// Shown once per session for accounts that somehow reached the app without a
// city set (e.g. admins, who are exempt from the mandatory /auth/onboard
// redirect) — everyone else already picks a city during onboarding.
export function LocationPromptModal() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [city, setCity] = useState("")
  const [saving, setSaving] = useState(false)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState("")
  const [dismissed, setDismissed] = useState(false)

  if (!session?.user || session.user.city || dismissed) return null

  async function save(cityValue?: string) {
    const value = (cityValue ?? city).trim()
    if (!value) return
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: value }),
      })
      if (res.ok) {
        await update()
        router.refresh()
      }
    } finally {
      setSaving(false)
    }
  }

  async function useCurrentLocation() {
    setLocating(true)
    setLocateError("")
    try {
      const detected = await detectCityFromBrowser()
      const matched = matchCity(detected, CITIES)
      setCity(matched)
      await save(matched)
    } catch (err) {
      setLocateError(err instanceof Error ? err.message : "Could not get your location.")
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6">
        <div className="h-11 w-11 rounded-xl bg-primary-100 dark:bg-primary-500/15 flex items-center justify-center mb-4">
          <MapPin className="h-5 w-5 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-base font-semibold">What&apos;s your city?</h2>
        <p className="text-xs text-muted-foreground mt-1 mb-4">
          We use this to show you listings, events, and colleagues near you.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full mb-3"
          onClick={useCurrentLocation}
          disabled={locating || saving}
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
          Use my current location
        </Button>
        <CityAutocomplete value={city} onChange={setCity} placeholder="Search your city…" />
        {locateError && <p className="text-xs text-red-600 mt-2">{locateError}</p>}
        <div className="flex items-center gap-2 mt-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setDismissed(true)}>
            Skip for now
          </Button>
          <Button size="sm" className="flex-1" disabled={!city.trim() || saving} onClick={() => save()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
