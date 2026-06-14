"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Render a same-size placeholder before mount to avoid layout shift
  if (!mounted) return <div className="h-9 w-9 shrink-0" />

  const isDark = resolvedTheme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="relative h-9 w-9 flex items-center justify-center rounded-xl shrink-0
                 hover:bg-muted text-muted-foreground hover:text-foreground
                 transition-colors overflow-hidden"
    >
      {/* Sun — visible in dark mode (click switches to light) */}
      <Sun className={cn(
        "absolute h-[18px] w-[18px] transition-all duration-300",
        isDark
          ? "opacity-100 rotate-0 scale-100"
          : "opacity-0 rotate-90 scale-75"
      )} />

      {/* Moon — visible in light mode (click switches to dark) */}
      <Moon className={cn(
        "absolute h-[18px] w-[18px] transition-all duration-300",
        !isDark
          ? "opacity-100 rotate-0 scale-100"
          : "opacity-0 -rotate-90 scale-75"
      )} />
    </button>
  )
}
