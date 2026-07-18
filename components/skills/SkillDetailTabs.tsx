"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface Section {
  key:   string
  label: string
  count?: number
}

// Sticky section nav for a single continuously-scrolling profile page —
// clicking jumps to the section; scrolling past a section's top highlights it.
export function SkillDetailTabs({ sections, children }: { sections: Section[]; children: React.ReactNode }) {
  const [active, setActive] = useState(sections[0]?.key)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const els = sections
      .map(s => document.getElementById(s.key))
      .filter((el): el is HTMLElement => !!el)
    if (els.length === 0) return

    const onScroll = () => {
      const offset = 120
      let current = els[0].id
      for (const el of els) {
        if (el.getBoundingClientRect().top - offset <= 0) current = el.id
      }
      setActive(current)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [sections])

  function jumpTo(key: string) {
    document.getElementById(key)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <div ref={containerRef}>
      <div className="sticky top-0 z-20 -mx-1 px-1 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center gap-1 border-b border-border/60 overflow-x-auto scrollbar-hide mb-6">
          {sections.map(s => (
            <button
              key={s.key}
              onClick={() => jumpTo(s.key)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                active === s.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}{s.count != null ? ` (${s.count})` : ""}
            </button>
          ))}
        </div>
      </div>
      {children}
    </div>
  )
}
