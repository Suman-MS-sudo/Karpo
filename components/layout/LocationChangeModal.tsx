"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { MapPin, Navigation } from "lucide-react"

export function LocationChangeModal({ from, to }: { from: string | null; to: string }) {
  // Rendered via a portal straight into <body> — the top nav has
  // backdrop-blur, and CSS backdrop-filter creates a containing block for
  // position:fixed descendants, which would otherwise pin this modal inside
  // the header instead of centering it on the full viewport.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 shadow-2xl">
        {/* Decorative "map" backdrop — dotted grid + soft glows, no external API needed */}
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="pointer-events-none absolute -top-16 -left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-fuchsia-300/20 blur-3xl" />

        <div className="relative p-8">
          <p className="text-center text-[11px] font-bold uppercase tracking-widest text-white/60 mb-6">
            Updating your location
          </p>

          {/* Route: from pin --- animated dashed path --- to pin */}
          <div className="flex items-center justify-between px-2">
            <div className="flex flex-col items-center gap-2 w-20">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                <MapPin className="h-5 w-5 text-white/70" />
              </span>
              <span className="text-xs font-medium text-white/70 text-center leading-tight truncate w-full">
                {from ?? "Unset"}
              </span>
            </div>

            <div className="flex-1 relative h-8 mx-2">
              <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <path
                  d="M0,10 Q50,-6 100,10"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="2"
                  strokeDasharray="4 5"
                />
                <circle r="3" fill="white">
                  <animateMotion dur="1.4s" repeatCount="indefinite" path="M0,10 Q50,-6 100,10" />
                </circle>
              </svg>
            </div>

            <div className="flex flex-col items-center gap-2 w-20">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg animate-bounce">
                <Navigation className="h-5 w-5 text-violet-600" />
              </span>
              <span className="text-xs font-bold text-white text-center leading-tight truncate w-full">
                {to}
              </span>
            </div>
          </div>

          <p className="text-center text-sm text-white/80 mt-7">
            Moving you to <span className="font-bold text-white">{to}</span>…
          </p>
          <p className="text-center text-xs text-white/50 mt-1">
            Listings, events &amp; colleagues nearby are being refreshed.
          </p>
        </div>
      </div>
    </div>,
    document.body
  )
}
