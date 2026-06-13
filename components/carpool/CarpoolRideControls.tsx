"use client"

import { useEffect, useRef, useState } from "react"
import { Navigation, Wifi, WifiOff, Play, Square, Loader2, MapPin, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  routeId:       string
  initialStatus: string
}

export function CarpoolRideControls({ routeId, initialStatus }: Props) {
  const [status,   setStatus]   = useState(initialStatus ?? "IDLE")
  const [loading,  setLoading]  = useState(false)
  const [gpsOk,    setGpsOk]    = useState(false)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [lastSent, setLastSent] = useState<Date | null>(null)
  const [error,    setError]    = useState("")

  const watchRef    = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const latestPos   = useRef<{ lat: number; lng: number } | null>(null)

  function startGPS() {
    if (!navigator.geolocation) { setError("GPS not available on this device"); return }
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsOk(true); setError("")
        setAccuracy(Math.round(pos.coords.accuracy))
        latestPos.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      },
      () => { setGpsOk(false); setError("Cannot read GPS — check browser permissions") },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
    intervalRef.current = setInterval(async () => {
      if (!latestPos.current) return
      try {
        await fetch(`/api/carpool/${routeId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ lat: latestPos.current.lat, lng: latestPos.current.lng }),
        })
        setLastSent(new Date())
      } catch {}
    }, 10_000)
  }

  function stopGPS() {
    if (watchRef.current    !== null) navigator.geolocation.clearWatch(watchRef.current)
    if (intervalRef.current !== null) clearInterval(intervalRef.current)
    watchRef.current = null; intervalRef.current = null; latestPos.current = null
    setGpsOk(false); setAccuracy(null)
  }

  async function handleStart() {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/carpool/${routeId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "START_RIDE" }),
      })
      if (res.ok) { setStatus("ACTIVE"); startGPS() }
      else        setError("Failed to start ride")
    } catch { setError("Network error") }
    finally  { setLoading(false) }
  }

  async function handleStop() {
    stopGPS(); setLoading(true)
    try {
      await fetch(`/api/carpool/${routeId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ action: "STOP_RIDE" }),
      })
      setStatus("IDLE")
    } catch { setError("Network error") }
    finally  { setLoading(false) }
  }

  // Resume GPS if ride was already active when page loaded
  useEffect(() => {
    if (initialStatus === "ACTIVE") startGPS()
    return stopGPS
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = status === "ACTIVE"

  return (
    <div className={`rounded-2xl border p-5 transition-all ${
      isActive
        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-700"
        : "bg-card border-border"
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
          isActive ? "bg-emerald-500" : "bg-muted"
        }`}>
          <Navigation className={`h-5 w-5 ${isActive ? "text-white" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {isActive ? "Ride in progress" : "Start your ride"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isActive ? "Your approved riders can see your live location" : "Broadcast your location to approved riders"}
          </p>
        </div>
        {isActive && (
          <div className="flex items-center gap-1.5 shrink-0">
            {gpsOk
              ? <><span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /><Wifi className="h-3.5 w-3.5 text-emerald-500" /></>
              : <><span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" /><WifiOff className="h-3.5 w-3.5 text-amber-400" /></>}
          </div>
        )}
      </div>

      {/* GPS status (only when active) */}
      {isActive && (
        <div className="mb-4 space-y-1.5 text-xs">
          {gpsOk ? (
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              GPS active{accuracy !== null ? ` · ±${accuracy}m accuracy` : ""}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <WifiOff className="h-3.5 w-3.5 shrink-0 animate-pulse" />
              Acquiring GPS signal…
            </div>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            <Radio className="h-3.5 w-3.5 shrink-0" />
            {lastSent
              ? `Broadcasting · last sent ${lastSent.toLocaleTimeString()}`
              : "Will broadcast every 10 seconds once GPS is ready"}
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 mb-3 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
      )}

      {isActive ? (
        <Button
          onClick={handleStop}
          disabled={loading}
          variant="destructive"
          className="w-full"
          size="sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Square className="h-4 w-4 mr-2 fill-current" />}
          End Ride
        </Button>
      ) : (
        <Button
          onClick={handleStart}
          disabled={loading}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2 fill-current" />}
          Start Ride
        </Button>
      )}
    </div>
  )
}
