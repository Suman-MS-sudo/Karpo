"use client"
import { useEffect, useRef, useState } from "react"
import { Building2, X, ChevronDown, Loader2 } from "lucide-react"
import { fuzzyIncludes } from "@/lib/fuzzy"
import { cn } from "@/lib/utils"

interface CompanyOption {
  id: string
  name: string
  domain: string
  logo: string | null
}

interface Props {
  value: string
  onChange: (name: string, companyId?: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  id?: string
}

/** Type-ahead company picker: suggests existing companies by name/domain
 * (typo-tolerant), but — like CityAutocomplete — still accepts a typed value
 * that isn't in the list, so posting a referral for a company not yet known
 * to Korpo is not blocked. */
export function CompanyAutocomplete({
  value,
  onChange,
  placeholder = "Type a company name…",
  required,
  className,
  id,
}: Props) {
  const [companies, setCompanies]     = useState<CompanyOption[]>([])
  const [loading, setLoading]         = useState(true)
  const [query, setQuery]             = useState(value)
  const [open, setOpen]               = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef       = useRef<HTMLUListElement>(null)
  const inputRef      = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch("/api/companies")
      .then((res) => res.json())
      .then((data) => setCompanies(data.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { setQuery(value) }, [value])

  const filtered = (query.trim().length === 0
    ? companies
    : companies.filter((c) => fuzzyIncludes(`${c.name} ${c.domain}`, query))
  ).slice(0, 50)

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

  const select = (c: CompanyOption) => {
    onChange(c.name, c.id)
    setQuery(c.name)
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
      if (highlighted >= 0 && filtered[highlighted]) select(filtered[highlighted])
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
      <input type="hidden" name={id} value={value} required={required} />

      <div
        className={cn(
          "flex items-center gap-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          open && "ring-2 ring-ring ring-offset-2"
        )}
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
      >
        <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
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
            // Propagate immediately (with no companyId) so a brand-new
            // company name typed here isn't blocked — it just won't have a
            // matched id until/unless the user picks a suggestion.
            onChange(v, undefined)
            setOpen(true)
            setHighlighted(-1)
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground min-w-0"
        />
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
        ) : query ? (
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
          {filtered.map((c, idx) => (
            <li
              key={c.id}
              role="option"
              aria-selected={c.name === value}
              onMouseDown={(e) => { e.preventDefault(); select(c) }}
              onMouseEnter={() => setHighlighted(idx)}
              className={cn(
                "px-3 py-2 text-sm cursor-pointer transition-colors truncate",
                highlighted === idx && "bg-muted",
                c.name === value && "font-medium text-primary"
              )}
            >
              {c.name}
            </li>
          ))}
        </ul>
      )}

      {open && !loading && query.trim() && filtered.length === 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-xl border border-border bg-popover shadow-xl px-3 py-2 text-xs text-muted-foreground">
          No match — "{query}" will be added as a new company.
        </div>
      )}
    </div>
  )
}
