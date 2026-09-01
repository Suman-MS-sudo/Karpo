// Client-side helper to detect the user's city via browser geolocation, then
// reverse-geocoded server-side through /api/geocode/reverse (a Nominatim
// proxy — Nominatim requires a real User-Agent, which browser fetch() can't
// set, so calling it directly from the client gets blocked/rate-limited).
"use client"

export function detectCityFromBrowser(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by your browser."))
      return
    }
    if (!window.isSecureContext) {
      reject(new Error("Location access requires a secure (https) connection. Please pick your city manually."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(`/api/geocode/reverse?lat=${latitude}&lon=${longitude}`)
          const data = await res.json().catch(() => null)
          if (!res.ok || !data?.city) {
            throw new Error(data?.error ?? "Could not determine your city.")
          }
          resolve(data.city as string)
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Could not determine your city."))
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location access was denied. Please pick your city manually."))
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          reject(new Error("Your location couldn't be determined. Please pick your city manually."))
        } else if (err.code === err.TIMEOUT) {
          reject(new Error("Location request timed out. Please pick your city manually."))
        } else {
          reject(new Error("Could not get your location. Please pick your city manually."))
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
    )
  })
}

// Matches a free-text detected city name against the known CITIES list
// case-insensitively; falls back to the raw detected name if no match.
export function matchCity(detected: string, cities: readonly string[]): string {
  const found = cities.find((c) => c.toLowerCase() === detected.toLowerCase())
  return found ?? detected
}
