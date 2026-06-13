"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const STAR = "0,-5 1.18,-1.62 4.76,-1.55 1.9,0.62 2.94,4.05 0,2 -2.94,4.05 -1.9,0.62 -4.76,-1.55 -1.18,-1.62"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-12 h-7 shrink-0" />

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative w-12 h-7 rounded-full overflow-hidden shrink-0
                 hover:scale-[1.07] active:scale-95
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary-600"
      style={{
        background: isDark ? "#0d1b3e" : "#5bb8f5",
        border:     isDark ? "2px solid #ffffff" : "2px solid rgba(255,255,255,0.75)",
        boxShadow:  isDark ? "0 1px 8px rgba(0,0,0,0.4)" : "0 1px 8px rgba(91,184,245,0.45)",
        transition: "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, transform 0.12s ease",
      }}
    >
      {/* Knob */}
      <div
        className="absolute rounded-full pointer-events-none z-20"
        style={{
          width: 21, height: 21,
          top: "50%", transform: "translateY(-50%)",
          left: isDark ? 2 : "calc(100% - 23px)",
          background: isDark ? "#ffffff" : "#FFD700",
          boxShadow: isDark
            ? "0 1px 6px rgba(0,0,0,0.35), inset 0 1px 2px rgba(255,255,255,0.5)"
            : "0 1px 8px rgba(200,140,0,0.5), 0 0 0 2px rgba(255,220,0,0.2)",
          transition: "left 0.42s cubic-bezier(0.34,1.56,0.64,1), background 0.4s ease, box-shadow 0.4s ease",
        }}
      />

      {/* Night */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 48 28"
        style={{ opacity: isDark ? 1 : 0, transition: "opacity 0.3s ease" }}>
        <polygon points={STAR} fill="#FFD700" transform="translate(26,10) scale(0.54)" />
        <polygon points={STAR} fill="#FFD700" transform="translate(31,19) scale(0.40)" />
        <polygon points={STAR} fill="#FFD700" transform="translate(34,8)  scale(0.36)" />
        <circle cx="40" cy="14" r="7"   fill="#FFD700" />
        <circle cx="44" cy="10" r="6"   fill="#0d1b3e" />
      </svg>

      {/* Day */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 48 28"
        style={{ opacity: isDark ? 0 : 1, transition: "opacity 0.3s ease" }}>
        <ellipse cx="11" cy="19" rx="6"   ry="3.5" fill="white" opacity="0.85" />
        <ellipse cx="15" cy="15" rx="5.5" ry="3.5" fill="white" opacity="0.75" />
        <ellipse cx="7"  cy="17" rx="4.5" ry="3"   fill="white" opacity="0.7"  />
        <ellipse cx="12" cy="23" rx="6.5" ry="2.5" fill="white" opacity="0.55" />
      </svg>
    </button>
  )
}
