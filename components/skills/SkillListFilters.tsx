"use client"

import { useState, useRef, useEffect, useTransition } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { ChevronDown, X, Star, SlidersHorizontal, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const FORMATS = [
  { value: "",          label: "Any format" },
  { value: "ONLINE",    label: "Online" },
  { value: "IN_PERSON", label: "In-person" },
  { value: "BOTH",      label: "Both" },
]

const EXPERIENCE_BANDS = [
  { value: "0",  label: "0-2 Years" },
  { value: "2",  label: "2-5 Years" },
  { value: "5",  label: "5-10 Years" },
  { value: "10", label: "10+ Years" },
]

const SORTS = [
  { value: "featured",   label: "Featured" },
  { value: "rating",     label: "Top rated" },
  { value: "popular",    label: "Most popular" },
  { value: "newest",     label: "Newest" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
]

interface Props {
  locations: string[]
  skillOptions: string[]
  children: React.ReactNode
}

function FilterDropdown({ label, active, children }: { label: string; active?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shadow-sm",
          active ? "ring-1 ring-primary/40 bg-primary/10 text-primary" : "ring-1 ring-border/60 bg-card text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        <ChevronDown className={cn("h-3 w-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-40 w-60 rounded-2xl bg-card ring-1 ring-border/60 shadow-xl p-3">
          {children}
        </div>
      )}
    </div>
  )
}

export function SkillListFilters({ locations, skillOptions, children }: Props) {
  const router   = useRouter()
  const pathname = usePathname()
  const sp       = useSearchParams()
  const [, startT] = useTransition()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const category  = sp.get("category")  ?? ""
  const format    = sp.get("format")    ?? ""
  const minExp    = sp.get("minExp")    ?? ""
  const minPrice  = sp.get("minPrice")  ?? ""
  const maxPrice  = sp.get("maxPrice")  ?? "5000"
  const minRating = sp.get("minRating") ?? ""
  const sort      = sp.get("sort")      ?? "featured"
  const location  = sp.get("location")  ?? ""
  const skills    = sp.get("skills")    ?? ""
  const aiMatch   = sp.get("ai") !== "off"

  const selectedLocations = location ? location.split(",") : []
  const selectedSkills    = skills ? skills.split(",") : []

  function push(overrides: Record<string, string>) {
    const params = new URLSearchParams(sp.toString())
    Object.entries(overrides).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k)
    })
    params.delete("page")
    startT(() => router.push(`${pathname}?${params.toString()}`))
  }

  function toggleListParam(key: string, current: string[], value: string) {
    const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value]
    push({ [key]: next.join(",") })
  }

  const hasFilters = !!(category || format || minExp || minPrice || minRating || location || skills || sort !== "featured" || (maxPrice && maxPrice !== "5000"))

  function clearAll() {
    startT(() => router.push(pathname))
  }

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6">
      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className={cn("space-y-6", sidebarOpen ? "block" : "hidden lg:block")}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Filters</h3>
          {hasFilters && <button onClick={clearAll} className="text-xs text-primary hover:underline">Clear all</button>}
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Format</p>
          <div className="space-y-2">
            {FORMATS.map(f => (
              <label key={f.value} className="flex items-center gap-2 text-sm cursor-pointer text-foreground/90">
                <input type="radio" name="format" checked={format === f.value} onChange={() => push({ format: f.value })} className="accent-primary" />
                {f.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Experience</p>
          <div className="space-y-2">
            {EXPERIENCE_BANDS.map(b => (
              <label key={b.value} className="flex items-center gap-2 text-sm cursor-pointer text-foreground/90">
                <input type="radio" name="minExp" checked={minExp === b.value} onChange={() => push({ minExp: b.value })} className="accent-primary" />
                {b.label}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Price (Hourly)</p>
          <input
            type="range" min={0} max={5000} step={100} value={maxPrice}
            onChange={e => push({ maxPrice: e.target.value })}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>₹0</span><span>₹{Number(maxPrice).toLocaleString()}+</span></div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Rating</p>
          <div className="space-y-2">
            {["4.5", "4", "3", ""].map(r => (
              <label key={r || "any"} className="flex items-center gap-2 text-sm cursor-pointer text-foreground/90">
                <input type="radio" name="minRating" checked={minRating === r} onChange={() => push({ minRating: r })} className="accent-primary" />
                {r ? <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{r}+ &amp; up</span> : "Any rating"}
              </label>
            ))}
          </div>
        </div>

        {skillOptions.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Skills</p>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {skillOptions.map(s => (
                <label key={s} className="flex items-center gap-2 text-sm cursor-pointer text-foreground/90">
                  <input type="checkbox" checked={selectedSkills.includes(s)} onChange={() => toggleListParam("skills", selectedSkills, s)} className="rounded accent-primary" />
                  {s}
                </label>
              ))}
            </div>
          </div>
        )}

        {locations.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">Location</p>
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {locations.map(l => (
                <label key={l} className="flex items-center gap-2 text-sm cursor-pointer text-foreground/90">
                  <input type="checkbox" checked={selectedLocations.includes(l)} onChange={() => toggleListParam("location", selectedLocations, l)} className="rounded accent-primary" />
                  {l}
                </label>
              ))}
            </div>
          </div>
        )}
      </aside>

      {/* ── Top bar + content slot ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 flex-wrap mb-6">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className={cn(
              "lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium shadow-sm transition-all",
              hasFilters ? "ring-1 ring-primary/40 bg-primary/10 text-primary" : "ring-1 ring-border/60 bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
            {hasFilters && <span className="h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">•</span>}
          </button>

          <FilterDropdown label="Sort by">
            <div className="space-y-1">
              {SORTS.map(s => (
                <button key={s.value} onClick={() => push({ sort: s.value })} className={cn("w-full text-left px-2 py-1.5 rounded-md text-xs font-medium", sort === s.value ? "bg-primary/10 text-primary" : "hover:bg-muted")}>{s.label}</button>
              ))}
            </div>
          </FilterDropdown>

          <div className="ml-auto flex items-center gap-3">
            {hasFilters && (
              <button onClick={clearAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
            <button onClick={() => push({ ai: aiMatch ? "off" : "" })} className="flex items-center gap-2 text-xs font-medium">
              <Sparkles className={cn("h-3.5 w-3.5", aiMatch ? "text-primary" : "text-muted-foreground")} />
              AI Match
              <span className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", aiMatch ? "bg-primary" : "bg-muted")}>
                <span className={cn("inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow", aiMatch ? "translate-x-4 ml-1" : "translate-x-0.5")} />
              </span>
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}
