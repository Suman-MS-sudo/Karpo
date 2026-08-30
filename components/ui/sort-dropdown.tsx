"use client"
import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortDropdownProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SortDropdown({ options, value, onChange, className }: SortDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = options.find((o) => o.value === value) ?? options[0]

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [open])

  return (
    <div ref={ref} className={cn("relative shrink-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="h-10 pl-4 pr-9 rounded-full border-2 border-violet-500 bg-background text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-400/50 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors whitespace-nowrap"
      >
        {active?.label}
      </button>
      <ChevronDown className={cn("absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500 pointer-events-none transition-transform", open && "rotate-180")} />

      {open && (
        <div className="absolute z-20 mt-2 w-[calc(100vw-2rem)] max-w-[240px] left-0 sm:left-auto sm:right-0 rounded-2xl border border-border bg-popover shadow-xl overflow-hidden divide-y divide-border">
          {options.map((o, i) => {
            const isActive = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left transition-colors",
                  isActive
                    ? "bg-violet-50 dark:bg-violet-950/30"
                    : "hover:bg-muted/60"
                )}
              >
                <span className={cn(
                  "text-[15px] leading-snug",
                  isActive ? "font-bold text-violet-600 dark:text-violet-400" : "font-medium text-muted-foreground",
                  i === 0 && !isActive && "font-semibold text-foreground"
                )}>
                  {o.label}
                </span>
                {isActive && <Check className="h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
