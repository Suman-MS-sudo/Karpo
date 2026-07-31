"use client"
import { useRouter, usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Check,
  LayoutGrid, Cpu, Car, Armchair, Tv, BookOpen,
  Dumbbell, Shirt, UtensilsCrossed, Briefcase,
  Bike, Activity, Palette, Ticket, Package,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SortDropdown } from "@/components/ui/sort-dropdown"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { cn } from "@/lib/utils"
import { LISTING_CATEGORIES, LISTING_CONDITIONS } from "@/config/services"

const CATEGORY_META: Record<string, { Icon: LucideIcon; iconBg: string; iconColor: string }> = {
  "":           { Icon: LayoutGrid,       iconBg: "bg-slate-100 dark:bg-white/10",         iconColor: "text-slate-600 dark:text-white"          },
  ELECTRONICS:  { Icon: Cpu,              iconBg: "bg-cyan-100 dark:bg-cyan-500/20",       iconColor: "text-cyan-600 dark:text-cyan-400"        },
  VEHICLE:      { Icon: Car,              iconBg: "bg-blue-100 dark:bg-blue-500/20",       iconColor: "text-blue-600 dark:text-blue-400"        },
  FURNITURE:    { Icon: Armchair,         iconBg: "bg-amber-100 dark:bg-amber-500/20",     iconColor: "text-amber-600 dark:text-amber-400"      },
  APPLIANCE:    { Icon: Tv,               iconBg: "bg-violet-100 dark:bg-violet-500/20",   iconColor: "text-violet-600 dark:text-violet-400"    },
  BOOKS:        { Icon: BookOpen,         iconBg: "bg-orange-100 dark:bg-orange-500/20",   iconColor: "text-orange-600 dark:text-orange-400"    },
  SPORTS:       { Icon: Dumbbell,         iconBg: "bg-lime-100 dark:bg-lime-500/20",       iconColor: "text-lime-600 dark:text-lime-400"        },
  CLOTHING:     { Icon: Shirt,            iconBg: "bg-pink-100 dark:bg-pink-500/20",       iconColor: "text-pink-600 dark:text-pink-400"        },
  KITCHEN:      { Icon: UtensilsCrossed,  iconBg: "bg-yellow-100 dark:bg-yellow-500/20",   iconColor: "text-yellow-600 dark:text-yellow-400"    },
  OFFICE:       { Icon: Briefcase,        iconBg: "bg-slate-100 dark:bg-slate-500/20",     iconColor: "text-slate-600 dark:text-slate-400"      },
  BICYCLE:      { Icon: Bike,             iconBg: "bg-emerald-100 dark:bg-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400"  },
  HEALTH:       { Icon: Activity,         iconBg: "bg-rose-100 dark:bg-rose-500/20",       iconColor: "text-rose-600 dark:text-rose-400"        },
  HOME_DECOR:   { Icon: Palette,          iconBg: "bg-purple-100 dark:bg-purple-500/20",   iconColor: "text-purple-600 dark:text-purple-400"    },
  TICKETS:      { Icon: Ticket,           iconBg: "bg-indigo-100 dark:bg-indigo-500/20",   iconColor: "text-indigo-600 dark:text-indigo-400"    },
  OTHER:        { Icon: Package,          iconBg: "bg-red-100 dark:bg-red-500/20",         iconColor: "text-red-600 dark:text-red-400"          },
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
  counts?: Record<string, number>
  totalCount?: number
}

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "views",      label: "Most viewed" },
  { value: "boosted",    label: "Boosted first" },
]

export function MarketplaceFilters({ current, counts = {}, totalCount = 0 }: Props) {
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500 pointer-events-none" />
          <Input
            placeholder="Search listings — iPhone, sofa, bike…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") applyFilters() }}
            className="pl-10 pr-24 h-10 rounded-full border-2 border-violet-500 text-[15px] font-medium text-muted-foreground focus-visible:ring-violet-400/50"
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
        <SortDropdown
          options={SORT_OPTIONS}
          value={current.sort ?? "newest"}
          onChange={(v) => push({ sort: v === "newest" ? undefined : v })}
        />

        {/* Advanced filters toggle */}
        <Button
          variant={showAdvanced ? "default" : "outline"}
          size="sm"
          className={cn(
            "h-10 gap-2 shrink-0 rounded-full font-medium",
            showAdvanced
              ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 border-transparent text-white hover:from-violet-600 hover:to-fuchsia-600"
              : "border-2 border-violet-500 text-foreground hover:bg-violet-50 dark:hover:bg-violet-950/30"
          )}
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <SlidersHorizontal className={cn("h-4 w-4", !showAdvanced && "text-violet-500")} />
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

        <div ref={pillsRef} className="flex flex-1 overflow-x-auto pb-0.5 scrollbar-hide">
          {[{ value: "", label: "All" }, ...LISTING_CATEGORIES].map((cat) => {
            const isActive = (current.category ?? "") === cat.value
            const meta = CATEGORY_META[cat.value] ?? CATEGORY_META[""]
            const count = cat.value === "" ? totalCount : (counts[cat.value] ?? 0)
            return (
              <button
                key={cat.value}
                onClick={() => push({ category: cat.value || undefined, q: current.q })}
                className={cn(
                  "flex flex-col items-center gap-1.5 py-2 relative transition-all duration-150 group shrink-0 min-w-[76px]",
                  isActive ? "opacity-100" : "opacity-40 hover:opacity-75"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-150",
                  isActive ? cn(meta.iconBg, "ring-2 ring-fuchsia-400 scale-110 shadow-[0_0_12px_rgba(217,70,239,0.4)]") : cn(meta.iconBg, "group-hover:scale-105")
                )}>
                  <meta.Icon className={cn("h-4.5 w-4.5", meta.iconColor)} style={{ width: 18, height: 18 }} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn("text-[11px] font-bold tracking-tight whitespace-nowrap", isActive ? "text-foreground" : "text-muted-foreground")}>
                  {cat.label}
                </span>
                <span className={cn("text-[10px] tabular-nums leading-none", isActive ? "text-muted-foreground" : "text-muted-foreground/40")}>
                  {count}
                </span>
                <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-150", isActive ? "w-8" : "w-0")} />
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
        <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {/* Condition */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Condition</p>
              <div className="space-y-1.5">
                {LISTING_CONDITIONS.map((c) => {
                  const isActive = pending.condition === c.value
                  return (
                    <button
                      key={c.value}
                      onClick={() => setPending((p) => ({ ...p, condition: p.condition === c.value ? "" : c.value }))}
                      className={cn(
                        "w-full text-left text-[15px] px-2.5 py-1.5 rounded-lg transition-all",
                        isActive ? "font-bold text-violet-600 dark:text-violet-400" : "font-medium text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {c.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Price range */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Price Range</p>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Min ₹"
                  value={pending.minPrice}
                  onChange={(e) => setPending((p) => ({ ...p, minPrice: e.target.value }))}
                  className="h-9 text-[15px] rounded-full font-medium text-muted-foreground placeholder:text-muted-foreground"
                />
                <Input
                  type="number"
                  placeholder="Max ₹"
                  value={pending.maxPrice}
                  onChange={(e) => setPending((p) => ({ ...p, maxPrice: e.target.value }))}
                  className="h-9 text-[15px] rounded-full font-medium text-muted-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {[["Under 5k", "", "5000"], ["5k-25k", "5000", "25000"], ["25k+", "25000", ""]].map(([l, mn, mx]) => (
                  <button
                    key={l}
                    onClick={() => setPending((p) => ({ ...p, minPrice: mn, maxPrice: mx }))}
                    className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* City — autocomplete */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">City</p>
              <CityAutocomplete
                value={pending.city}
                onChange={(city) => setPending((p) => ({ ...p, city }))}
                placeholder="Search city…"
              />
            </div>

            {/* Negotiable + extras */}
            <div className="sm:col-span-2 lg:col-span-2">
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">More options</p>
              <button
                onClick={() => setPending((p) => ({ ...p, negotiable: !p.negotiable }))}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-2 rounded-full border text-[15px] transition-all",
                  pending.negotiable
                    ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 font-bold"
                    : "border-border text-muted-foreground font-medium hover:text-foreground"
                )}
              >
                <span className="text-base">🤝</span>
                Negotiable price only
                {pending.negotiable && <Check className="h-4 w-4 ml-auto text-violet-600 dark:text-violet-400" />}
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
