"use client"
import { useRouter, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Search, SlidersHorizontal, X, ChevronDown,
  LayoutGrid, Cpu, Car, Armchair, Tv, BookOpen,
  Dumbbell, Shirt, UtensilsCrossed, Briefcase,
  Bike, Activity, Palette, Ticket, Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { LISTING_CATEGORIES, LISTING_CONDITIONS, CITIES } from "@/config/services"

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
  const router = useRouter()
  const pathname = usePathname()
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pillsRef      = useRef<HTMLDivElement>(null)
  const scrollRafRef  = useRef<number | null>(null)
  const [searchValue, setSearchValue] = useState(current.q ?? "")
  const [showAdvanced, setShowAdvanced] = useState(false)

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

  // Count active filters (excluding sort and q since they have dedicated UI)
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

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (searchValue !== (current.q ?? "")) {
        push({ q: searchValue || undefined, category: current.category })
      }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue])

  const clearAll = () => {
    setSearchValue("")
    router.push(pathname)
  }

  const hasAnyFilter = Object.values(current).some(Boolean)

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
            className="pl-9 h-10"
          />
          {searchValue && (
            <button
              onClick={() => { setSearchValue(""); push({ q: undefined }) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
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
          {activeFilterCount > 0 && (
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

      {/* Category chips — horizontal scroll with edge-hover auto-scroll */}
      <div className="relative">
        {/* Left scroll zone */}
        <div
          className="absolute left-0 top-0 bottom-0.5 w-10 z-10 pointer-events-auto"
          style={{ background: "linear-gradient(to right, hsl(var(--background)) 40%, transparent)" }}
          onMouseEnter={() => startScroll(-1)}
          onMouseLeave={stopScroll}
        />
        {/* Right scroll zone */}
        <div
          className="absolute right-0 top-0 bottom-0.5 w-10 z-10 pointer-events-auto"
          style={{ background: "linear-gradient(to left, hsl(var(--background)) 40%, transparent)" }}
          onMouseEnter={() => startScroll(1)}
          onMouseLeave={stopScroll}
        />

        <div ref={pillsRef} className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
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
      </div>

      {/* Advanced filter panel */}
      {showAdvanced && (
        <div className="bg-muted/40 border border-border rounded-xl p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Condition */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Condition</p>
            <div className="space-y-1.5">
              {LISTING_CONDITIONS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => push({ condition: current.condition === c.value ? undefined : c.value })}
                  className={cn(
                    "w-full text-left text-sm px-2.5 py-1.5 rounded-lg border transition-all",
                    current.condition === c.value ? c.badge + " font-semibold" : "border-transparent hover:bg-muted"
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
                value={current.minPrice ?? ""}
                onChange={(e) => push({ minPrice: e.target.value || undefined })}
                className="h-8 text-sm"
              />
              <Input
                type="number"
                placeholder="Max ₹"
                value={current.maxPrice ?? ""}
                onChange={(e) => push({ maxPrice: e.target.value || undefined })}
                className="h-8 text-sm"
              />
            </div>
            {/* Quick ranges */}
            <div className="flex flex-wrap gap-1 mt-2">
              {[["Under 5k", "", "5000"], ["5k-25k", "5000", "25000"], ["25k+", "25000", ""]].map(([l, mn, mx]) => (
                <button
                  key={l}
                  onClick={() => push({ minPrice: mn || undefined, maxPrice: mx || undefined })}
                  className="text-xs px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground"
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* City */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">City</p>
            <div className="space-y-1.5">
              {CITIES.map((c) => (
                <button
                  key={c}
                  onClick={() => push({ city: current.city === c ? undefined : c })}
                  className={cn(
                    "w-full text-left text-sm px-2.5 py-1.5 rounded-lg border transition-all",
                    current.city === c
                      ? "bg-primary/10 border-primary/30 text-primary font-medium"
                      : "border-transparent hover:bg-muted"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Negotiable + extras */}
          <div className="sm:col-span-2 lg:col-span-2">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">More options</p>
            <button
              onClick={() => push({ negotiable: current.negotiable ? undefined : "1" })}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-sm transition-all",
                current.negotiable
                  ? "bg-success/10 border-success/30 text-success font-medium"
                  : "border-border hover:bg-muted"
              )}
            >
              <span className="text-base">🤝</span>
              Negotiable price only
              {current.negotiable && <span className="ml-auto text-success">✓</span>}
            </button>
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

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
      {label}
      <button onClick={onRemove} className="ml-0.5 hover:text-primary/70">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}
