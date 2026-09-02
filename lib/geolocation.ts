// Client-side helper to detect the user's city via browser geolocation, then
// reverse-geocoded server-side through /api/geocode/reverse (a Nominatim
// proxy — Nominatim requires a real User-Agent, which browser fetch() can't
// set, so calling it directly from the client gets blocked/rate-limited).
"use client"

// Thrown when the browser reports the user has previously denied the
// permission — the browser will not show the native prompt again, so the UI
// needs to point the user at their browser's own site-settings instead of
// just retrying.
export class LocationPermissionDeniedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LocationPermissionDeniedError"
  }
}

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
          reject(new LocationPermissionDeniedError(
            "Location access is blocked for Korpo in your browser. Enable it in your browser's site settings, then try again."
          ))
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

// Short, browser-specific steps to re-enable a previously-denied location
// permission — shown alongside LocationPermissionDeniedError since the
// browser won't show its own prompt again until the user does this manually.
export function getEnableLocationSteps(): string {
  if (typeof navigator === "undefined") return ""
  const ua = navigator.userAgent
  if (/Chrome|Edg/.test(ua) && !/Firefox/.test(ua)) {
    return "Click the lock/info icon in the address bar → Site settings → set Location to Allow, then reload."
  }
  if (/Firefox/.test(ua)) {
    return "Click the lock icon in the address bar → Permissions → clear the Blocked Location setting, then reload."
  }
  if (/Safari/.test(ua)) {
    return "Go to Safari → Settings for This Website → set Location to Allow, then reload the page."
  }
  return "Open your browser's site settings for this page and allow Location access, then reload."
}

// Matches a free-text detected city name against the known CITIES list
// case-insensitively; falls back to the raw detected name if no match.
export function matchCity(detected: string, cities: readonly string[]): string {
  const found = cities.find((c) => c.toLowerCase() === detected.toLowerCase())
  return found ?? detected
}
