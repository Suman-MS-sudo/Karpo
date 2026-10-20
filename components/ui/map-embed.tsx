"use client"

import { MapPin } from "lucide-react"
import { saveConsent, useCookieConsent } from "@/lib/cookie-consent"

// Google Maps iframes set Google cookies, so they only load once the visitor
// has allowed "functional & third-party embeds" (see /cookies).
export function MapEmbed({ location, title = "Location" }: { location: string; title?: string }) {
  const consent = useCookieConsent()
  if (!location.trim()) return null
  const q = encodeURIComponent(location)

  if (!consent?.functional) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/40 h-[200px] w-full mt-2 flex flex-col items-center justify-center gap-2 p-4 text-center">
        <MapPin className="h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground max-w-xs">
          Map previews are provided by Google, which may set cookies. Allow functional cookies to show the map.
        </p>
        <button type="button" onClick={() => saveConsent(true)} className="text-xs font-semibold text-primary hover:underline">
          Allow &amp; show map
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden border border-border h-[200px] w-full mt-2">
      <iframe
        title={title}
        src={`https://maps.google.com/maps?q=${q}&output=embed&z=15`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}
