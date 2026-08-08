"use client"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SortDropdown } from "@/components/ui/sort-dropdown"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { cn } from "@/lib/utils"

interface Filters {
  q?: string
  type?: string
  city?: string
  furnished?: string
  bhk?: string
  budget?: string
  sort?: string
}

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest first" },
  { value: "price_asc",  label: "Rent: Low → High" },
  { value: "price_desc", label: "Rent: High → Low" },
  { value: "views",      label: "Most viewed" },
]

interface Props {
  current: Filters
}

const FURNISHED_OPTS = [
  { value: "",            label: "Any" },
  { value: "FULLY",       label: "Fully Furnished" },
  { value: "SEMI",        label: "Semi Furnished" },
  { value: "UNFURNISHED", label: "Unfurnished" },
]

const BHK_OPTS = ["1BHK", "2BHK", "3BHK", "4BHK+", "Studio", "Room", "PG Room"]

const RENT_RANGES = [
  { value: "",            label: "Any Budget" },
  { value: "0-10000",     label: "Under ₹10k" },
  { value: "10000-20000", label: "₹10k–₹20k" },
  { value: "20000-35000", label: "₹20k–₹35k" },
  { value: "35000-",      label: "₹35k+" },
]

export function RentalFilters({ current }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const [searchValue, setSearchValue] = useState(current.q ?? "")
  const [pending, setPending] = useState({
    furnished: current.furnished ?? "",
    bhk:       current.bhk       ?? "",
    budget:    current.budget    ?? "",
    city:      current.city      ?? "",
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    setSearchValue(current.q ?? "")
    setPending({
      furnished: current.furnished ?? "",
      bhk:       current.bhk       ?? "",
      budget:    current.budget    ?? "",
      city:      current.city      ?? "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current.q, current.furnished, current.bhk, current.budget, current.city])

  const push = (overrides: Filters) => {
    const merged = { ...current, ...overrides }
    const params = new URLSearchParams()
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v) })
    router.push(`${pathname}?${params.toString()}`)
  }

  const applyFilters = () => {
    push({
      q:         searchValue || undefined,
      furnished: pending.furnished || undefined,
      bhk:       pending.bhk || undefined,
      budget:    pending.budget || undefined,
      city:      pending.city || undefined,
    })
    setShowAdvanced(false)
  }

  const clearAll = () => {
    setSearchValue("")
    setPending({ furnished: "", bhk: "", budget: "", city: "" })
    router.push(pathname)
  }

  const activeFilterCount = [current.furnished, current.bhk, current.budget, current.city].filter(Boolean).length
  const hasAnyFilter = Object.values(current).some(Boolean)
  const hasPendingChange =
    pending.furnished !== (current.furnished ?? "") ||
    pending.bhk       !== (current.bhk       ?? "") ||
    pending.budget    !== (current.budget    ?? "") ||
    pending.city      !== (current.city      ?? "")

  return (
    <div className="space-y-3">
      {/* Sort + filters toggle row */}
      <div className="flex gap-2">
        {/* Sort */}
        <SortDropdown
          options={SORT_OPTIONS}
          value={current.sort ?? "newest"}
          onChange={(v) => push({ sort: v === "newest" ? undefined : v })}
        />

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Furnishing */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Furnishing</p>
              <div className="space-y-1.5">
                {FURNISHED_OPTS.map((f) => {
                  const isActive = pending.furnished === f.value
                  return (
                    <button
                      key={f.value}
                      onClick={() => setPending((p) => ({ ...p, furnished: p.furnished === f.value ? "" : f.value }))}
                      className={cn(
                        "w-full text-left text-[15px] px-2.5 py-1.5 rounded-lg transition-all",
                        isActive ? "font-bold text-violet-600 dark:text-violet-400" : "font-medium text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* BHK / Size */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">BHK / Size</p>
              <div className="flex flex-wrap gap-1.5">
                {BHK_OPTS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setPending((p) => ({ ...p, bhk: p.bhk === b ? "" : b }))}
                    className={cn(
                      "text-xs font-medium px-2.5 py-1.5 rounded-full border transition-all",
                      pending.bhk === b ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 font-bold" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">City</p>
              <CityAutocomplete
                value={pending.city}
                onChange={(city) => setPending((p) => ({ ...p, city }))}
                placeholder="Search city…"
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2.5 uppercase tracking-wide">Budget</p>
            <div className="flex flex-wrap gap-1.5">
              {RENT_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setPending((p) => ({ ...p, budget: r.value }))}
                  className={cn(
                    "text-xs font-medium px-2.5 py-1.5 rounded-full border transition-all",
                    pending.budget === r.value ? "bg-violet-50 dark:bg-violet-950/30 border-violet-300 dark:border-violet-700 text-violet-600 dark:text-violet-400 font-bold" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action row */}
          <div className="flex items-center gap-2 pt-1 border-t border-border">
            <Button className="flex-1 sm:flex-none gap-2" onClick={applyFilters}>
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
          {current.furnished && (
            <Chip label={FURNISHED_OPTS.find((f) => f.value === current.furnished)?.label} onRemove={() => push({ furnished: undefined })} />
          )}
          {current.bhk && <Chip label={current.bhk} onRemove={() => push({ bhk: undefined })} />}
          {current.budget && (
            <Chip label={RENT_RANGES.find((r) => r.value === current.budget)?.label} onRemove={() => push({ budget: undefined })} />
          )}
          {current.city && <Chip label={current.city} onRemove={() => push({ city: undefined })} />}
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
