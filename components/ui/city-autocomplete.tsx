"use client"
import { useEffect, useRef, useState } from "react"
import { MapPin, X, ChevronDown } from "lucide-react"
import { CITIES } from "@/config/services"
import { cn } from "@/lib/utils"

interface Props {
  value: string
  onChange: (city: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  id?: string
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = "Type a city name…",
  required,
  className,
  id,
}: Props) {
  const [query, setQuery]       = useState(value)
  const [open, setOpen]         = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef      = useRef<HTMLUListElement>(null)
  const inputRef     = useRef<HTMLInputElement>(null)

  // Keep local query in sync if parent updates value externally
  useEffect(() => { setQuery(value) }, [value])

  const filtered = query.trim().length === 0
    ? CITIES.slice(0, 50)
    : CITIES.filter((c) => c.toLowerCase().includes(query.toLowerCase())).slice(0, 50)

  // Close on outside click — keep whatever the user typed (custom city names
  // that aren't in the predefined list are still valid filter/search values).
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement
      item?.scrollIntoView({ block: "nearest" })
    }
  }, [highlighted])

  const select = (city: string) => {
    onChange(city)
    setQuery(city)
    setOpen(false)
    setHighlighted(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") setOpen(true)
      return
    }
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, filtered.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      if (highlighted >= 0 && filtered[highlighted]) {
        select(filtered[highlighted])
      } else if (filtered.length > 0) {
        select(filtered[0])
      }
    } else if (e.key === "Escape") {
      setOpen(false)
      setQuery(value)
    }
  }

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange("")
    setQuery("")
    inputRef.current?.focus()
    setOpen(true)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Hidden native input so form validation works */}
      <input type="hidden" name={id} value={value} required={required} />

      <div
        className={cn(
          "flex items-center gap-1.5 h-10 w-full rounded-full border-2 bg-background px-4 text-[15px] font-medium transition-colors",
          open ? "border-violet-500 ring-2 ring-violet-400/50" : "border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30"
        )}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        <MapPin className="h-3.5 w-3.5 text-violet-500 shrink-0" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const v = e.target.value
            setQuery(v)
            // Propagate immediately so custom city names (not in the predefined
            // list) are captured too, not just ones picked from the dropdown.
            onChange(v)
            setOpen(true)
            setHighlighted(-1)
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
        />
        {query ? (
          <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          <ChevronDown className={cn("h-3.5 w-3.5 text-violet-500 shrink-0 transition-transform", open && "rotate-180")} />
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-2 max-h-60 overflow-y-auto rounded-2xl border border-border bg-popover shadow-xl divide-y divide-border"
          role="listbox"
        >
          {filtered.map((city, idx) => {
            const isActive = city === value
            return (
              <li
                key={city}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => { e.preventDefault(); select(city) }}
                onMouseEnter={() => setHighlighted(idx)}
                className={cn(
                  "px-4 py-2.5 text-[15px] cursor-pointer transition-colors",
                  highlighted === idx && "bg-violet-50 dark:bg-violet-950/30",
                  isActive ? "font-bold text-violet-600 dark:text-violet-400" : "font-medium text-muted-foreground"
                )}
              >
                {city}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
