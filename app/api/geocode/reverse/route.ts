import { NextRequest, NextResponse } from "next/server"

// Reverse-geocodes lat/lon to a city name via Nominatim (OpenStreetMap).
// Proxied server-side because Nominatim's usage policy requires a meaningful
// User-Agent identifying the calling app — browser fetch() can't set that
// header, so calling it directly from the client gets silently blocked/
// rate-limited, which was the root cause of "Use my current location"
// failing with an error.
export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat")
  const lon = req.nextUrl.searchParams.get("lon")
  if (!lat || !lon) {
    return NextResponse.json({ error: "lat and lon are required" }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Korpo/1.0 (https://korpo.app; contact@korpo.app)",
        },
      }
    )
    if (!res.ok) {
      return NextResponse.json({ error: "Could not determine your city." }, { status: 502 })
    }
    const data = await res.json()
    const address = data?.address ?? {}
    const city: string | undefined =
      address.city || address.town || address.county || address.state_district
    if (!city) {
      return NextResponse.json({ error: "Could not determine your city from your location." }, { status: 404 })
    }
    return NextResponse.json({ city })
  } catch {
    return NextResponse.json({ error: "Could not determine your city." }, { status: 502 })
  }
}
