"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, ChevronDown, ChevronUp, X, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const DEPARTMENTS = [
  "Engineering", "Product", "Design", "Data & Analytics", "Sales",
  "Marketing", "Finance", "HR", "Operations", "Legal", "Consulting", "Other",
]
const WORK_MODES = [
  { value: "REMOTE",  label: "Remote"   },
  { value: "HYBRID",  label: "Hybrid"   },
  { value: "ONSITE",  label: "On-site"  },
]
const JOB_TYPES = [
  { value: "FULL_TIME",  label: "Full-time"  },
  { value: "PART_TIME",  label: "Part-time"  },
  { value: "CONTRACT",   label: "Contract"   },
  { value: "INTERNSHIP", label: "Internship" },
]
const CITIES = ["Hyderabad", "Bangalore", "Pune", "Chennai", "Mumbai", "Delhi NCR", "Kolkata"]

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
        active
          ? "bg-violet-600 border-violet-600 text-white"
          : "bg-card border-border text-muted-foreground hover:border-violet-400 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  )
}

export function ReferralSearchBar() {
  const router = useRouter()
  const params = useSearchParams()

  const [query,     setQuery]     = useState(params.get("q")        ?? "")
  const [company,   setCompany]   = useState(params.get("company")  ?? "")
  const [depts,     setDepts]     = useState<string[]>(params.get("dept")  ? params.get("dept")!.split(",")  : [])
  const [cities,    setCities]    = useState<string[]>(params.get("city")  ? params.get("city")!.split(",")  : [])
  const [modes,     setModes]     = useState<string[]>(params.get("mode")  ? params.get("mode")!.split(",")  : [])
  const [types,     setTypes]     = useState<string[]>(params.get("type")  ? params.get("type")!.split(",")  : [])
  const [hasBonus,  setHasBonus]  = useState(params.get("bonus")  === "1")
  const [minExp,    setMinExp]    = useState(params.get("minExp")   ?? "")
  const [maxExp,    setMaxExp]    = useState(params.get("maxExp")   ?? "")
  const [minSalary, setMinSalary] = useState(params.get("minSal")  ?? "")
  const [maxSalary, setMaxSalary] = useState(params.get("maxSal")  ?? "")
  const [open,      setOpen]      = useState(false)

  const activeFilterCount =
    depts.length + cities.length + modes.length + types.length +
    (company.trim() ? 1 : 0) +
    (hasBonus ? 1 : 0) +
    (minExp ? 1 : 0) + (maxExp ? 1 : 0) +
    (minSalary ? 1 : 0) + (maxSalary ? 1 : 0)

  useEffect(() => {
    if (activeFilterCount > 0) setOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) =>
    setList(list.includes(value) ? list.filter((x) => x !== value) : [...list, value])

  const handleSearch = useCallback(() => {
    const p = new URLSearchParams()
    if (query.trim())        p.set("q",       query.trim())
    if (company.trim())      p.set("company", company.trim())
    if (depts.length)        p.set("dept",    depts.join(","))
    if (cities.length)       p.set("city",    cities.join(","))
    if (modes.length)        p.set("mode",    modes.join(","))
    if (types.length)        p.set("type",    types.join(","))
    if (hasBonus)            p.set("bonus",   "1")
    if (minExp)              p.set("minExp",  minExp)
    if (maxExp)              p.set("maxExp",  maxExp)
    if (minSalary)           p.set("minSal",  minSalary)
    if (maxSalary)           p.set("maxSal",  maxSalary)
    router.push(`/referrals?${p.toString()}`)
  }, [query, company, depts, cities, modes, types, hasBonus, minExp, maxExp, minSalary, maxSalary, router])

  const handleClear = () => {
    setQuery(""); setCompany(""); setDepts([]); setCities([])
    setModes([]); setTypes([]); setHasBonus(false)
    setMinExp(""); setMaxExp(""); setMinSalary(""); setMaxSalary("")
    router.push("/referrals")
  }

  const hasAny = !!query.trim() || !!company.trim() || activeFilterCount > 0

  return (
    <div className="bg-card border border-border rounded-2xl p-4 mb-6 space-y-3">
      {/* Search + company row */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by title, department, skills…"
            className="pl-9"
          />
        </div>
        <div className="relative w-44 shrink-0">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Company…"
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setOpen((o) => !o)}
          className="gap-2 shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="h-5 w-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </Button>
        <Button onClick={handleSearch} className="shrink-0">Search</Button>
      </div>

      {/* Filter panel */}
      {open && (
        <div className="pt-3 border-t border-border space-y-4">

          {/* Location */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Location / City</p>
            <div className="flex flex-wrap gap-1.5">
              {CITIES.map((c) => (
                <Chip key={c} label={c} active={cities.includes(c)} onClick={() => toggle(cities, setCities, c)} />
              ))}
            </div>
          </div>

          {/* Department */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Department</p>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTMENTS.map((d) => (
                <Chip key={d} label={d} active={depts.includes(d)} onClick={() => toggle(depts, setDepts, d)} />
              ))}
            </div>
          </div>

          {/* Work mode + Job type */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Work Mode</p>
              <div className="flex flex-wrap gap-1.5">
                {WORK_MODES.map((m) => (
                  <Chip key={m.value} label={m.label} active={modes.includes(m.value)} onClick={() => toggle(modes, setModes, m.value)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Job Type</p>
              <div className="flex flex-wrap gap-1.5">
                {JOB_TYPES.map((t) => (
                  <Chip key={t.value} label={t.label} active={types.includes(t.value)} onClick={() => toggle(types, setTypes, t.value)} />
                ))}
              </div>
            </div>
          </div>

          {/* Experience + Salary ranges */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Experience (years)</p>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} max={30} placeholder="Min"
                  value={minExp} onChange={(e) => setMinExp(e.target.value)} className="w-20 h-8 text-sm" />
                <span className="text-muted-foreground text-sm">–</span>
                <Input type="number" min={0} max={30} placeholder="Max"
                  value={maxExp} onChange={(e) => setMaxExp(e.target.value)} className="w-20 h-8 text-sm" />
                <span className="text-xs text-muted-foreground">yrs</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Salary (LPA)</p>
              <div className="flex items-center gap-2">
                <Input type="number" min={0} placeholder="Min"
                  value={minSalary} onChange={(e) => setMinSalary(e.target.value)} className="w-20 h-8 text-sm" />
                <span className="text-muted-foreground text-sm">–</span>
                <Input type="number" min={0} placeholder="Max"
                  value={maxSalary} onChange={(e) => setMaxSalary(e.target.value)} className="w-20 h-8 text-sm" />
                <span className="text-xs text-muted-foreground">L</span>
              </div>
            </div>
          </div>

          {/* Bonus toggle */}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              type="button"
              onClick={() => setHasBonus((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                hasBonus
                  ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400"
                  : "border-border text-muted-foreground hover:border-amber-400"
              }`}
            >
              💰 Has referral bonus
            </button>
          </div>

          {/* Clear */}
          {hasAny && (
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}
