"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { MapPin, Loader2 } from "lucide-react"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { Button } from "@/components/ui/button"

// Shown once per session for accounts that somehow reached the app without a
// city set (e.g. admins, who are exempt from the mandatory /auth/onboard
// redirect) — everyone else already picks a city during onboarding.
export function LocationPromptModal() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [city, setCity] = useState("")
  const [saving, setSaving] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  if (!session?.user || session.user.city || dismissed) return null

  async function save() {
    if (!city.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: city.trim() }),
      })
      if (res.ok) {
        await update()
        router.refresh()
      }
    } finally {
      setSaving(false)
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
        <CityAutocomplete value={city} onChange={setCity} placeholder="Search your city…" />
        <div className="flex items-center gap-2 mt-4">
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setDismissed(true)}>
            Skip for now
          </Button>
          <Button size="sm" className="flex-1" disabled={!city.trim() || saving} onClick={save}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
