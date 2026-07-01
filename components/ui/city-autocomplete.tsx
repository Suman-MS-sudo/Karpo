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

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        // If input doesn't match a valid city, reset to last valid or empty
        if (!CITIES.includes(query)) {
          setQuery(value)
        }
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [query, value])

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
          "flex items-center gap-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          open && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          value={query}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value)
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
          <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl py-1"
          role="listbox"
        >
          {filtered.map((city, idx) => (
            <li
              key={city}
              role="option"
              aria-selected={city === value}
              onMouseDown={(e) => { e.preventDefault(); select(city) }}
              onMouseEnter={() => setHighlighted(idx)}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer transition-colors",
                highlighted === idx && "bg-muted",
                city === value && "font-medium text-primary"
              )}
            >
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
