"use client"
import { useRouter, usePathname } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Search, SlidersHorizontal, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SortDropdown } from "@/components/ui/sort-dropdown"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { cn } from "@/lib/utils"
import { LISTING_CONDITIONS } from "@/config/services"

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

// "Boosted first" is temporarily hidden along with the rest of the boost
// feature (BOOST_ENABLED, see components/marketplace/BoostButton.tsx) — the
// underlying sort still works server-side if re-enabled, no data change needed.
const BOOST_ENABLED = false

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "views",      label: "Most viewed" },
  ...(BOOST_ENABLED ? [{ value: "boosted", label: "Boosted first" }] : []),
]

export function MarketplaceFilters({ current }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

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
      {/* Sort + advanced filters row */}
      <div className="flex flex-wrap gap-2">
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

      {/* Advanced filter panel */}
      {showAdvanced && (
        <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-6">
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
