"use client"
import { useEffect, useState } from "react"
import { Navigation } from "lucide-react"

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function DistanceText({ lat, lng }: { lat: number; lng: number }) {
  const [dist, setDist] = useState<number | null>(null)

  useEffect(() => {
    if (!navigator?.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => setDist(haversineKm(pos.coords.latitude, pos.coords.longitude, lat, lng)),
      () => {} // silently ignore if user denies
    )
  }, [lat, lng])

  if (dist === null) return null

  const label = dist < 1 ? `${Math.round(dist * 1000)} m away` : `${dist.toFixed(1)} km away`

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Navigation className="h-3 w-3" />
      {label}
    </span>
  )
}
