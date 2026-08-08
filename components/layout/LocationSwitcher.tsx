"use client"

import { useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import { MapPin, ChevronDown, Check, Loader2 } from "lucide-react"
import { CITIES } from "@/config/services"
import { cn } from "@/lib/utils"
import { LocationChangeModal } from "./LocationChangeModal"

export function LocationSwitcher() {
  const { data: session, update } = useSession()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [saving, setSaving] = useState(false)
  // Optimistic local override for instant feedback while the save is in
  // flight — the actual persisted value comes from `update()` re-issuing a
  // fresh JWT cookie (via a POST to /api/auth/session, which re-triggers our
  // jwt() callback with trigger:"update" and refetches the user from the
  // DB), followed by a full reload so every server-rendered page picks up
  // that fresh cookie. Skipping `update()` and only reloading is NOT enough:
  // a plain reload just re-sends the *existing* (stale) JWT cookie, which is
  // never re-signed until something explicitly triggers the update.
  const [pendingCity, setPendingCity] = useState<string | null>(null)
  const [transition, setTransition] = useState<{ from: string | null; to: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const city = pendingCity ?? session?.user?.city

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery("")
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 0)
    }
  }, [open])

  const filtered = query.trim().length === 0
    ? CITIES
    : CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase()))

  async function selectCity(next: string) {
    console.log("[LocationSwitcher] selectCity called", { next, currentCity: city })
    if (next === city) {
      console.log("[LocationSwitcher] no-op — already this city")
      setOpen(false)
      return
    }
    setSaving(true)
    setTransition({ from: city ?? null, to: next })
    setPendingCity(next)
    setOpen(false)
    try {
      console.log("[LocationSwitcher] PATCH /api/profile", { city: next })
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city: next }),
      })
      console.log("[LocationSwitcher] PATCH response", { status: res.status, ok: res.ok })
      if (!res.ok) {
        const body = await res.text().catch(() => "<unreadable>")
        console.error("[LocationSwitcher] PATCH failed", { status: res.status, body })
        setPendingCity(null)
        setTransition(null)
        return
      }
      const patched = await res.json().catch(() => null)
      console.log("[LocationSwitcher] PATCH succeeded, server returned", patched)

      // Re-sign the JWT cookie with the fresh city from the DB, then do a
      // full reload so every server-rendered page (which reads the city
      // straight from that cookie) picks it up too.
      console.log("[LocationSwitcher] calling next-auth update()…")
      const newSession = await update()
      console.log("[LocationSwitcher] update() resolved, session now", newSession)
      console.log("[LocationSwitcher] reloading page…")
      window.location.reload()
      return
    } catch (err) {
      console.error("[LocationSwitcher] selectCity threw", err)
      setPendingCity(null)
      setTransition(null)
    } finally {
      setSaving(false)
    }
  }

  if (!session?.user) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-xl hover:bg-muted px-2 py-1.5 transition-colors max-w-[140px]"
        title="Change location"
      >
        <MapPin className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400 shrink-0" />
        <span className="hidden md:block text-xs font-semibold truncate">
          {city ?? "Set location"}
        </span>
        {saving ? (
          <Loader2 className="h-3 w-3 text-muted-foreground animate-spin shrink-0" />
        ) : (
          <ChevronDown className={cn("h-3 w-3 text-muted-foreground shrink-0 transition-transform hidden md:block", open && "rotate-180")} />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-72 bg-card border border-border rounded-2xl shadow-xl p-3">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city…"
            className="w-full h-9 px-3 mb-2 text-sm bg-muted/60 rounded-xl outline-none border border-transparent focus:border-primary-400"
          />
          <ul className="max-h-64 overflow-y-auto -mx-1">
            {filtered.map((c) => {
              const isActive = c === city
              return (
                <li key={c}>
                  <button
                    onClick={() => selectCity(c)}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm text-left transition-colors hover:bg-muted",
                      isActive && "font-semibold text-primary-600 dark:text-primary-400"
                    )}
                  >
                    {c}
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                </li>
              )
            })}
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">No matching city</li>
            )}
          </ul>
        </div>
      )}

      {transition && <LocationChangeModal from={transition.from} to={transition.to} />}
    </div>
  )
}
