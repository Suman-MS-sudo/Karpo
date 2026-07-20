"use client"
import { useEffect, useRef, useState } from "react"
import { X, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  options: string[]
  value: string[]
  onChange: (v: string[]) => void
  placeholder?: string
  icon?: React.ReactNode
  className?: string
}

/** Type-ahead multi-select: search a large option list, add as chips. Used for
 * filter panels where the option list (cities, departments) is too long for
 * a flat row of toggle chips. */
export function TagAutocomplete({ options, value, onChange, placeholder = "Type to search…", icon, className }: Props) {
  const [query, setQuery]             = useState("")
  const [open, setOpen]               = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef       = useRef<HTMLUListElement>(null)
  const inputRef      = useRef<HTMLInputElement>(null)

  const filtered = options
    .filter((o) => !value.includes(o))
    .filter((o) => query.trim() === "" || o.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 50)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      const item = listRef.current.children[highlighted] as HTMLElement
      item?.scrollIntoView({ block: "nearest" })
    }
  }, [highlighted])

  function add(o: string) {
    onChange([...value, o])
    setQuery("")
    setOpen(false)
    setHighlighted(-1)
    inputRef.current?.focus()
  }
  function remove(o: string) {
    onChange(value.filter((v) => v !== o))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
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
      if (highlighted >= 0 && filtered[highlighted]) add(filtered[highlighted])
      else if (filtered.length > 0) add(filtered[0])
    } else if (e.key === "Escape") {
      setOpen(false)
    } else if (e.key === "Backspace" && !query && value.length) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-center gap-1.5 h-9 w-full rounded-lg border border-input bg-background px-3 text-sm",
          "focus-within:ring-2 focus-within:ring-ring",
          open && "ring-2 ring-ring"
        )}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        {icon}
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          value={query}
          placeholder={value.length ? "Add another…" : placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setHighlighted(-1) }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0 text-sm"
        />
        <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform", open && "rotate-180")} />
      </div>

      {open && filtered.length > 0 && (
        <ul
          ref={listRef}
          className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl py-1"
          role="listbox"
        >
          {filtered.map((o, idx) => (
            <li
              key={o}
              role="option"
              onMouseDown={(e) => { e.preventDefault(); add(o) }}
              onMouseEnter={() => setHighlighted(idx)}
              className={cn("px-3 py-2 text-sm cursor-pointer transition-colors", highlighted === idx && "bg-muted")}
            >
              {o}
            </li>
          ))}
        </ul>
      )}

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-full font-medium">
              {v}
              <button type="button" onClick={() => remove(v)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
