"use client"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Search, SlidersHorizontal, X, Home, DoorOpen, Users2, Building2, LandPlot, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

const TYPES = [
  { value: "",          label: "All Types",  icon: Home },
  { value: "APARTMENT", label: "Apartment",  icon: Building2 },
  { value: "ROOM",      label: "Room",       icon: DoorOpen },
  { value: "PG",        label: "PG",         icon: Users2 },
  { value: "FLATMATE",  label: "Flatmate",   icon: Users2 },
  { value: "STUDIO",    label: "Studio",     icon: Home },
  { value: "VILLA",     label: "Villa",      icon: LandPlot },
]

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
      {/* Search + filters toggle row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search rentals — area, society, landmark…"
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
            <Button size="sm" className="h-8 px-3 text-xs" onClick={applyFilters}>
              Search
            </Button>
          </div>
        </div>

        {/* Sort */}
        <div className="relative shrink-0">
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

      {/* Type chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
        {TYPES.map((t) => {
          const isActive = (current.type ?? "") === t.value
          const Icon = t.icon
          return (
            <button
              key={t.value}
              onClick={() => push({ type: t.value || undefined })}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
                isActive
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-transparent border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-3 w-3 shrink-0" />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Advanced filter panel */}
      {showAdvanced && (
        <div className="bg-muted/40 border border-border rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Furnishing */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Furnishing</p>
              <div className="space-y-1.5">
                {FURNISHED_OPTS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setPending((p) => ({ ...p, furnished: p.furnished === f.value ? "" : f.value }))}
                    className={cn(
                      "w-full text-left text-sm px-2.5 py-1.5 rounded-lg border transition-all",
                      pending.furnished === f.value ? "bg-primary/10 border-primary/30 text-primary font-semibold" : "border-transparent hover:bg-muted"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* BHK / Size */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">BHK / Size</p>
              <div className="flex flex-wrap gap-1.5">
                {BHK_OPTS.map((b) => (
                  <button
                    key={b}
                    onClick={() => setPending((p) => ({ ...p, bhk: p.bhk === b ? "" : b }))}
                    className={cn(
                      "text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                      pending.bhk === b ? "bg-primary/10 border-primary/30 text-primary font-semibold" : "border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* City */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">City</p>
              <CityAutocomplete
                value={pending.city}
                onChange={(city) => setPending((p) => ({ ...p, city }))}
                placeholder="Search city…"
              />
            </div>
          </div>

          {/* Budget */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Budget</p>
            <div className="flex flex-wrap gap-1.5">
              {RENT_RANGES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setPending((p) => ({ ...p, budget: r.value }))}
                  className={cn(
                    "text-xs px-2.5 py-1.5 rounded-lg border transition-all",
                    pending.budget === r.value ? "bg-primary/10 border-primary/30 text-primary font-semibold" : "border-border text-muted-foreground hover:bg-muted"
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
