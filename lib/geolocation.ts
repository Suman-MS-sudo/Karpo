// Client-side helper to detect the user's city via browser geolocation +
// Nominatim (OpenStreetMap) reverse geocoding — free, no API key required.
"use client"

export function detectCityFromBrowser(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Geolocation is not supported by your browser."))
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { Accept: "application/json" } }
          )
          if (!res.ok) throw new Error("Could not determine your city.")
          const data = await res.json()
          const address = data?.address ?? {}
          const detected: string | undefined =
            address.city || address.town || address.county || address.state_district
          if (!detected) throw new Error("Could not determine your city from your location.")
          resolve(detected)
        } catch (err) {
          reject(err instanceof Error ? err : new Error("Could not determine your city."))
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          reject(new Error("Location access was denied. Please pick your city manually."))
        } else {
          reject(new Error("Could not get your location. Please pick your city manually."))
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    )
  })
}

// Matches a free-text detected city name against the known CITIES list
// case-insensitively; falls back to the raw detected name if no match.
export function matchCity(detected: string, cities: readonly string[]): string {
  const found = cities.find((c) => c.toLowerCase() === detected.toLowerCase())
  return found ?? detected
}
