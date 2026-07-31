"use client"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Search, SlidersHorizontal, X, Home, DoorOpen, Users2, Building2, LandPlot, LayoutGrid } from "lucide-react"
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
  counts?: Record<string, number>
  totalCount?: number
}

const TYPES = [
  { value: "",          label: "All",        icon: LayoutGrid, iconBg: "bg-slate-100 dark:bg-white/10",         iconColor: "text-slate-600 dark:text-white"          },
  { value: "APARTMENT", label: "Apartment",  icon: Building2,  iconBg: "bg-blue-100 dark:bg-blue-500/20",       iconColor: "text-blue-600 dark:text-blue-400"        },
  { value: "ROOM",      label: "Room",       icon: DoorOpen,   iconBg: "bg-violet-100 dark:bg-violet-500/20",   iconColor: "text-violet-600 dark:text-violet-400"    },
  { value: "PG",        label: "PG",         icon: Users2,     iconBg: "bg-orange-100 dark:bg-orange-500/20",   iconColor: "text-orange-600 dark:text-orange-400"    },
  { value: "FLATMATE",  label: "Flatmate",   icon: Users2,     iconBg: "bg-pink-100 dark:bg-pink-500/20",       iconColor: "text-pink-600 dark:text-pink-400"        },
  { value: "STUDIO",    label: "Studio",     icon: Home,       iconBg: "bg-cyan-100 dark:bg-cyan-500/20",       iconColor: "text-cyan-600 dark:text-cyan-400"        },
  { value: "VILLA",     label: "Villa",      icon: LandPlot,   iconBg: "bg-emerald-100 dark:bg-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400"  },
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

export function RentalFilters({ current, counts = {}, totalCount = 0 }: Props) {
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-500 pointer-events-none" />
          <Input
            placeholder="Search rentals — area, society, landmark…"
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
            <Button size="sm" className="h-8 px-3 text-xs" onClick={applyFilters}>
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

      {/* Type chips */}
      <div className="flex overflow-x-auto pb-0.5 scrollbar-hide">
        {TYPES.map((t) => {
          const isActive = (current.type ?? "") === t.value
          const Icon = t.icon
          const count = t.value === "" ? totalCount : (counts[t.value] ?? 0)
          return (
            <button
              key={t.value}
              onClick={() => push({ type: t.value || undefined })}
              className={cn(
                "flex flex-col items-center gap-1.5 py-2 relative transition-all duration-150 group shrink-0 min-w-[76px]",
                isActive ? "opacity-100" : "opacity-40 hover:opacity-75"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-2xl flex items-center justify-center transition-all duration-150",
                isActive ? cn(t.iconBg, "ring-2 ring-fuchsia-400 scale-110 shadow-[0_0_12px_rgba(217,70,239,0.4)]") : cn(t.iconBg, "group-hover:scale-105")
              )}>
                <Icon className={cn("h-4.5 w-4.5", t.iconColor)} style={{ width: 18, height: 18 }} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn("text-[11px] font-bold tracking-tight whitespace-nowrap", isActive ? "text-foreground" : "text-muted-foreground")}>
                {t.label}
              </span>
              <span className={cn("text-[10px] tabular-nums leading-none", isActive ? "text-muted-foreground" : "text-muted-foreground/40")}>
                {count}
              </span>
              <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 transition-all duration-150", isActive ? "w-8" : "w-0")} />
            </button>
          )
        })}
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
