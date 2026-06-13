"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Search, SlidersHorizontal, X, Star } from "lucide-react"

const CATEGORIES = [
  { value: "",            label: "All Skills" },
  { value: "TECH",        label: "Tech & Dev" },
  { value: "DATA",        label: "Data & AI" },
  { value: "DESIGN",      label: "Design & UX" },
  { value: "ENGINEERING", label: "Engineering" },
  { value: "MARKETING",   label: "Marketing" },
  { value: "BUSINESS",    label: "Business" },
  { value: "FINANCE",     label: "Finance" },
  { value: "LEGAL",       label: "Legal" },
  { value: "LANGUAGE",    label: "Languages" },
  { value: "COACHING",    label: "Coaching" },
  { value: "CREATIVE",    label: "Creative" },
  { value: "WELLNESS",    label: "Wellness" },
]

const FORMATS = [
  { value: "",           label: "Any format" },
  { value: "ONLINE",     label: "Online" },
  { value: "IN_PERSON",  label: "In-person" },
  { value: "BOTH",       label: "Both" },
]

const SORTS = [
  { value: "featured",    label: "Featured" },
  { value: "rating",      label: "Top rated" },
  { value: "popular",     label: "Most popular" },
  { value: "newest",      label: "Newest" },
  { value: "price_asc",   label: "Price: Low → High" },
  { value: "price_desc",  label: "Price: High → Low" },
]

export function SkillFilters() {
  const router     = useRouter()
  const pathname   = usePathname()
  const sp         = useSearchParams()
  const [, startT] = useTransition()
  const [open, setOpen] = useState(false)

  const [q,         setQ]         = useState(sp.get("q")         ?? "")
  const [category,  setCategory]  = useState(sp.get("category")  ?? "")
  const [format,    setFormat]    = useState(sp.get("format")    ?? "")
  const [minPrice,  setMinPrice]  = useState(sp.get("minPrice")  ?? "")
  const [maxPrice,  setMaxPrice]  = useState(sp.get("maxPrice")  ?? "")
  const [minRating, setMinRating] = useState(sp.get("minRating") ?? "")
  const [sort,      setSort]      = useState(sp.get("sort")      ?? "featured")

  function push(overrides: Record<string, string> = {}) {
    const params = new URLSearchParams()
    const vals = { q, category, format, minPrice, maxPrice, minRating, sort, ...overrides }
    Object.entries(vals).forEach(([k, v]) => { if (v) params.set(k, v) })
    startT(() => router.push(`${pathname}?${params.toString()}`))
  }

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => push(), 350)
    return () => clearTimeout(t)
  }, [q]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasFilters = category || format || minPrice || maxPrice || minRating || sort !== "featured"

  return (
    <div className="space-y-4">
      {/* Search + sort row */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search skills, topics, or expertise…"
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          {q && <button onClick={() => { setQ(""); push({ q: "" }) }} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3.5 w-3.5 text-muted-foreground" /></button>}
        </div>
        <select value={sort} onChange={(e) => { setSort(e.target.value); push({ sort: e.target.value }) }}
          className="text-sm px-3 py-2.5 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring">
          {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => setOpen((v) => !v)}
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${open || hasFilters ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300" : "border-border text-muted-foreground hover:text-foreground"}`}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters {hasFilters && <span className="h-2 w-2 rounded-full bg-primary-500" />}
        </button>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => { setCategory(c.value); push({ category: c.value }) }}
            className={`shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all ${
              category === c.value
                ? "border-primary-500 bg-primary-500 text-white"
                : "border-border text-muted-foreground hover:border-muted-foreground/50 bg-background"
            }`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Advanced filters */}
      {open && (
        <div className="bg-muted/30 border border-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Format */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Format</p>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <button key={f.value} onClick={() => { setFormat(f.value); push({ format: f.value }) }}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${format === f.value ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300" : "border-border text-muted-foreground"}`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Price range */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price (₹)</p>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                onBlur={() => push()} min={0}
                className="w-full text-sm px-3 py-1.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
              <span className="text-muted-foreground text-xs">–</span>
              <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                onBlur={() => push()} min={0}
                className="w-full text-sm px-3 py-1.5 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {[["0","500"],["500","2000"],["2000","5000"],["5000",""]].map(([min,max]) => (
                <button key={`${min}-${max}`} onClick={() => { setMinPrice(min); setMaxPrice(max); push({ minPrice: min, maxPrice: max }) }}
                  className="text-[11px] px-2 py-1 rounded-md border border-border text-muted-foreground hover:border-muted-foreground/50">
                  {min && max ? `₹${min}–${max}` : min ? `₹${min}+` : `Up to ₹${max}`}
                </button>
              ))}
            </div>
          </div>

          {/* Min rating */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Minimum Rating</p>
            <div className="flex gap-2">
              {["","3","4","4.5"].map((r) => (
                <button key={r} onClick={() => { setMinRating(r); push({ minRating: r }) }}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${minRating === r ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300" : "border-border text-muted-foreground"}`}>
                  {r ? <><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{r}+</> : "Any"}
                </button>
              ))}
            </div>
          </div>

          {/* Clear */}
          {hasFilters && (
            <div className="sm:col-span-3">
              <button onClick={() => { setCategory(""); setFormat(""); setMinPrice(""); setMaxPrice(""); setMinRating(""); setSort("featured"); push({ category: "", format: "", minPrice: "", maxPrice: "", minRating: "", sort: "featured" }) }}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1.5">
                <X className="h-3.5 w-3.5" />Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
