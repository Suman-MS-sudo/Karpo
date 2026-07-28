"use client"

import { useEffect, useRef, useState } from "react"
import { Clock, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function formatTime12(hhmm: string) {
  if (!hhmm) return ""
  const [h, m] = hhmm.split(":").map(Number)
  const period = h >= 12 ? "PM" : "AM"
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, "0")} ${period}`
}

// Quick-pick slots every 30 minutes, 6 AM – midnight
const SLOTS = Array.from({ length: 37 }, (_, i) => {
  const totalMin = 6 * 60 + i * 30
  const h = Math.floor(totalMin / 60) % 24
  const m = totalMin % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
})

interface Props {
  value:    string
  onChange: (v: string) => void
}

export function TimeSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const slotsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  useEffect(() => {
    if (open && value) {
      const el = slotsRef.current?.querySelector(`[data-slot="${value}"]`)
      el?.scrollIntoView({ block: "nearest" })
    }
  }, [open, value])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 pl-9 pr-3 h-10 rounded-lg border border-input bg-background text-sm text-left focus:outline-none focus:ring-2 focus:ring-ring hover:border-muted-foreground/40 transition-colors"
      >
        <Clock className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
        <span className={cn("flex-1 truncate", !value && "text-muted-foreground")}>
          {value ? formatTime12(value) : "Select time"}
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 left-0 w-64 bg-popover border border-border rounded-xl shadow-lg overflow-hidden">
          <div ref={slotsRef} className="max-h-52 overflow-y-auto p-1.5 grid grid-cols-3 gap-1">
            {SLOTS.map((t) => (
              <button
                key={t}
                type="button"
                data-slot={t}
                onClick={() => { onChange(t); setOpen(false) }}
                className={cn(
                  "text-xs font-medium px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap",
                  value === t ? "bg-primary-600 text-white" : "hover:bg-muted text-foreground"
                )}
              >
                {formatTime12(t)}
              </button>
            ))}
          </div>
          <div className="border-t border-border p-2 flex items-center gap-2 bg-muted/30">
            <span className="text-[11px] text-muted-foreground shrink-0">Custom</span>
            <input
              type="time"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 text-xs h-7 px-2 rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}
    </div>
  )
}
