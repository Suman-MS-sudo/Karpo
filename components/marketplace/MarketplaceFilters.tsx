"use client"
import { useRouter, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Search, SlidersHorizontal, X, ChevronDown, ChevronLeft, ChevronRight,
  LayoutGrid, Cpu, Car, Armchair, Tv, BookOpen,
  Dumbbell, Shirt, UtensilsCrossed, Briefcase,
  Bike, Activity, Palette, Ticket, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { cn } from "@/lib/utils"
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from "@/config/services"

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "":           LayoutGrid,
  ELECTRONICS:  Cpu,
  VEHICLE:      Car,
  FURNITURE:    Armchair,
  APPLIANCE:    Tv,
  BOOKS:        BookOpen,
  SPORTS:       Dumbbell,
  CLOTHING:     Shirt,
  KITCHEN:      UtensilsCrossed,
  OFFICE:       Briefcase,
  BICYCLE:      Bike,
  HEALTH:       Activity,
  HOME_DECOR:   Palette,
  TICKETS:      Ticket,
  OTHER:        Package,
}

interface Filters {
  q?: string
  category?: string
  condition?: string
  minPrice?: string
  maxPrice?: string
  city?: string
  negotiable?: string
  sort?: string
}

interface Props {
  current: Filters
}

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "views",      label: "Most viewed" },
  { value: "boosted",    label: "Boosted first" },
]

export function MarketplaceFilters({ current }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const pillsRef     = useRef<HTMLDivElement>(null)
  const scrollRafRef = useRef<number | null>(null)

  // Committed (URL-level) search input
  const [searchValue, setSearchValue] = useState(current.q ?? "")

  // Pending (draft) filter state — only applied when Search is clicked
  const [pending, setPending] = useState<{
    condition: string
    minPrice:  string
    maxPrice:  string
    city:      string
    negotiable: boolean
  }>({
    condition:  current.condition  ?? "",
    minPrice:   current.minPrice   ?? "",
    maxPrice:   current.maxPrice   ?? "",
    city:       current.city       ?? "",
    negotiable: !!current.negotiable,
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  // Sync pending state if URL changes externally (e.g. browser back)
  useEffect(() => {
    setPending({
      condition:  current.condition  ?? "",
      minPrice:   current.minPrice   ?? "",
      maxPrice:   current.maxPrice   ?? "",
      city:       current.city       ?? "",
      negotiable: !!current.negotiable,
    })
    setSearchValue(current.q ?? "")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.condition, current.minPrice, current.maxPrice, current.city, current.negotiable, current.q])

  const startScroll = (dir: -1 | 1) => {
    const el = pillsRef.current
    if (!el) return
    const tick = () => {
      el.scrollLeft += dir * 6
      scrollRafRef.current = requestAnimationFrame(tick)
    }
    scrollRafRef.current = requestAnimationFrame(tick)
  }
  const stopScroll = () => {
    if (scrollRafRef.current) cancelAnimationFrame(scrollRafRef.current)
  }

  // Count pending filter changes relative to URL
  const pendingFilterCount = [
    pending.condition,
    pending.minPrice,
    pending.maxPrice,
    pending.city,
    pending.negotiable ? "1" : "",
  ].filter(Boolean).length

  // Count active committed filters (shown as chips)
  const activeFilterCount = [
    current.condition, current.minPrice, current.maxPrice,
    current.city, current.negotiable,
  ].filter(Boolean).length

  const buildUrl = useCallback(
    (overrides: Filters) => {
      const merged = { ...current, ...overrides }
      const params = new URLSearchParams()
      Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
      return `${pathname}?${params.toString()}`
    },
    [current, pathname]
  )

  const push = useCallback((overrides: Filters) => router.push(buildUrl(overrides)), [buildUrl, router])

  // Apply all pending filters + current search on Search click
  const applyFilters = () => {
    const params = new URLSearchParams()
    if (searchValue)         params.set("q",         searchValue)
    if (current.category)    params.set("category",   current.category)
    if (current.sort && current.sort !== "newest") params.set("sort", current.sort)
    if (pending.condition)   params.set("condition",  pending.condition)
    if (pending.minPrice)    params.set("minPrice",   pending.minPrice)
    if (pending.maxPrice)    params.set("maxPrice",   pending.maxPrice)
    if (pending.city)        params.set("city",       pending.city)
    if (pending.negotiable)  params.set("negotiable", "1")
    router.push(`${pathname}?${params.toString()}`)
    setShowAdvanced(false)
  }

  const clearAll = () => {
    setSearchValue("")
    setPending({ condition: "", minPrice: "", maxPrice: "", city: "", negotiable: false })
    router.push(pathname)
  }

  const hasAnyFilter = Object.values(current).some(Boolean)
  const hasPendingChange =
    pending.condition  !== (current.condition  ?? "") ||
    pending.minPrice   !== (current.minPrice   ?? "") ||
    pending.maxPrice   !== (current.maxPrice   ?? "") ||
    pending.city       !== (current.city       ?? "") ||
    pending.negotiable !== !!current.negotiable

  return (
    <div className="space-y-3 mb-6">
      {/* Search + sort row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search listings — iPhone, sofa, bike…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyFilters() }}
            className="pl-9 pr-24 h-10"
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchValue && (
              <button
                onClick={() => { setSearchValue(""); push({ q: undefined }) }}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <Button
              size="sm"
              className="h-8 px-3 text-xs"
              onClick={applyFilters}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Sort */}
        <div className="relative">
          <select
            value={current.sort ?? "newest"}
            onChange={(e) => push({ sort: e.target.value === "newest" ? undefined : e.target.value })}
            className="h-10 pl-3 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {/* Advanced filters toggle */}
        <Button
          variant={showAdvanced ? "default" : "outline"}
          size="sm"
          className="h-10 gap-2 shrink-0"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {(activeFilterCount > 0 || hasPendingChange) && (
            <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {hasAnyFilter && (
          <Button variant="ghost" size="sm" className="h-10 text-muted-foreground shrink-0" onClick={clearAll}>
            <X className="h-4 w-4" /> Clear
          </Button>
        )}
      </div>

      {/* Category chips — horizontal scroll with arrow buttons */}
      <div className="relative flex items-center gap-1">
        <button
          type="button"
          aria-label="Scroll categories left"
          onMouseDown={() => startScroll(-1)}
          onMouseUp={stopScroll}
          onMouseLeave={stopScroll}
          onClick={() => { const el = pillsRef.current; if (el) el.scrollBy({ left: -200, behavior: "smooth" }) }}
          className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors shadow-sm"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <div ref={pillsRef} className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide flex-1">
          {[{ value: "", label: "All" }, ...LISTING_CATEGORIES].map((cat) => {
            const isActive = (current.category ?? "") === cat.value
            const Icon = CATEGORY_ICONS[cat.value] ?? Package
            return (
              <button
                key={cat.value}
                onClick={() => push({ category: cat.value || undefined, q: current.q })}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
                  isActive
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="h-3 w-3 shrink-0" />
                {cat.label}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          aria-label="Scroll categories right"
          onMouseDown={() => startScroll(1)}
          onMouseUp={stopScroll}
          onMouseLeave={stopScroll}
          onClick={() => { const el = pillsRef.current; if (el) el.scrollBy({ left: 200, behavior: "smooth" }) }}
          className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full border border-border bg-background hover:bg-muted transition-colors shadow-sm"
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Advanced filter panel */}
      {showAdvanced && (
        <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Condition */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Condition</p>
              <div className="space-y-1.5">
                {LISTING_CONDITIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setPending((p) => ({ ...p, condition: p.condition === c.value ? "" : c.value }))}
                    className={cn(
                      "w-full text-left text-sm px-2.5 py-1.5 rounded-lg border transition-all",
                      pending.condition === c.value ? c.badge + " font-semibold" : "border-transparent hover:bg-muted"
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Price range */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Price Range</p>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Min ₹"
                  value={pending.minPrice}
                  onChange={(e) => setPending((p) => ({ ...p, minPrice: e.target.value }))}
                  className="h-8 text-sm"
                />
                <Input
                  type="number"
                  placeholder="Max ₹"
                  value={pending.maxPrice}
                  onChange={(e) => setPending((p) => ({ ...p, maxPrice: e.target.value }))}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {[["Under 5k", "", "5000"], ["5k-25k", "5000", "25000"], ["25k+", "25000", ""]].map(([l, mn, mx]) => (
                  <button
                    key={l}
                    onClick={() => setPending((p) => ({ ...p, minPrice: mn, maxPrice: mx }))}
                    className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* City — autocomplete */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">City</p>
              <CityAutocomplete
                value={pending.city}
                onChange={(city) => setPending((p) => ({ ...p, city }))}
                placeholder="Search city…"
              />
            </div>

            {/* Negotiable + extras */}
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">More options</p>
              <button
                onClick={() => setPending((p) => ({ ...p, negotiable: !p.negotiable }))}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-sm transition-all",
                  pending.negotiable
                    ? "bg-success/10 border-success/30 text-success font-medium"
                    : "border-border hover:bg-muted"
                )}
              >
                <span className="text-base">🤝</span>
                Negotiable price only
                {pending.negotiable && <span className="ml-auto text-success">✓</span>}
              </button>
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Button
              className="flex-1 sm:flex-none gap-2"
              onClick={applyFilters}
            >
              <Search className="h-4 w-4" />
              Search
              {hasPendingChange && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/70" />}
            </Button>
            {(hasAnyFilter || hasPendingChange) && (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={clearAll}>
                <X className="h-3.5 w-3.5 mr-1" /> Clear all
              </Button>
            )}
            <Button variant="outline" size="sm" className="ml-auto" onClick={() => setShowAdvanced(false)}>
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {current.condition && (
            <Chip label={`Condition: ${LISTING_CONDITIONS.find(c => c.value === current.condition)?.label}`}
              onRemove={() => push({ condition: undefined })} />
          )}
          {(current.minPrice || current.maxPrice) && (
            <Chip label={`₹${current.minPrice ?? "0"} – ₹${current.maxPrice ?? "∞"}`}
              onRemove={() => push({ minPrice: undefined, maxPrice: undefined })} />
          )}
          {current.city && (
            <Chip label={current.city} onRemove={() => push({ city: undefined })} />
          )}
          {current.negotiable && (
            <Chip label="Negotiable only" onRemove={() => push({ negotiable: undefined })} />
          )}
        </div>
      )}
    </div>
  )
}

function Chip({ label, onRemove }: { label: string | undefined; onRemove: () => void }) {
  if (!label) return null
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-primary/70">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
