"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Search, Plus, X, LayoutGrid, List, Zap, ChevronLeft, ChevronRight,
  Wrench, Code2, Palette, Calculator, Briefcase, GraduationCap,
  Camera, HeartPulse, Megaphone, Database, MoreHorizontal, Star,
  MapPin, Clock, DollarSign, SlidersHorizontal, CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ServiceItem {
  id:          string
  title:       string
  description: string
  category:    string
  priceType:   string   // HOURLY | FIXED | NEGOTIABLE
  price:       number | null
  portfolio:   string[] | string   // may arrive as JSON string from DB
  city:        string | null
  createdAt:   string
  user: {
    id:       string
    name:     string | null
    image:    string | null
    jobTitle: string | null
    company:  { name: string } | null
  }
}

interface Props {
  services:       ServiceItem[]
  totalServices:  number
  isPremium:      boolean
  myCount:        number
  skillsLimit:    number
}

// ── Categories ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "All",         label: "All",        Icon: LayoutGrid,    iconBg: "bg-slate-100 dark:bg-white/10",         iconColor: "text-slate-600 dark:text-white"          },
  { value: "TECH",        label: "Tech & IT",  Icon: Code2,         iconBg: "bg-blue-100 dark:bg-blue-500/20",       iconColor: "text-blue-600 dark:text-blue-400"        },
  { value: "DESIGN",      label: "Design",     Icon: Palette,       iconBg: "bg-purple-100 dark:bg-purple-500/20",   iconColor: "text-purple-600 dark:text-purple-400"    },
  { value: "FINANCE",     label: "Finance",    Icon: Calculator,    iconBg: "bg-emerald-100 dark:bg-emerald-500/20", iconColor: "text-emerald-600 dark:text-emerald-400"  },
  { value: "BUSINESS",    label: "Business",   Icon: Briefcase,     iconBg: "bg-amber-100 dark:bg-amber-500/20",     iconColor: "text-amber-600 dark:text-amber-400"      },
  { value: "COACHING",    label: "Coaching",   Icon: GraduationCap, iconBg: "bg-indigo-100 dark:bg-indigo-500/20",   iconColor: "text-indigo-600 dark:text-indigo-400"    },
  { value: "PHOTOGRAPHY", label: "Photo/Video",Icon: Camera,        iconBg: "bg-rose-100 dark:bg-rose-500/20",       iconColor: "text-rose-600 dark:text-rose-400"        },
  { value: "WELLNESS",    label: "Health",     Icon: HeartPulse,    iconBg: "bg-pink-100 dark:bg-pink-500/20",       iconColor: "text-pink-600 dark:text-pink-400"        },
  { value: "MARKETING",   label: "Marketing",  Icon: Megaphone,     iconBg: "bg-orange-100 dark:bg-orange-500/20",   iconColor: "text-orange-600 dark:text-orange-400"    },
  { value: "DATA",        label: "Data",       Icon: Database,      iconBg: "bg-cyan-100 dark:bg-cyan-500/20",       iconColor: "text-cyan-600 dark:text-cyan-400"        },
  { value: "LEGAL",       label: "Legal",      Icon: Wrench,        iconBg: "bg-slate-100 dark:bg-slate-500/20",     iconColor: "text-slate-600 dark:text-slate-400"      },
  { value: "OTHER",       label: "Other",      Icon: MoreHorizontal,iconBg: "bg-gray-100 dark:bg-gray-500/20",       iconColor: "text-gray-600 dark:text-gray-400"        },
]

const PRICE_TYPE_LABEL: Record<string, string> = {
  HOURLY: "/hr", FIXED: "fixed", NEGOTIABLE: "negotiable",
}

function parsePortfolio(p: string[] | string): string[] {
  if (Array.isArray(p)) return p
  try { return JSON.parse(p) } catch { return [] }
}

function initials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2)
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ServicesClient({ services, totalServices, isPremium, myCount, skillsLimit }: Props) {
  const searchParams = useSearchParams()

  const [search,      setSearch]      = useState("")
  const [category,    setCategory]    = useState(() => searchParams.get("category") ?? "All")
  const [priceType,   setPriceType]   = useState("all")   // all | HOURLY | FIXED | NEGOTIABLE
  const [sort,        setSort]        = useState("recent") // recent | price_asc | price_desc
  const [view,        setView]        = useState<"grid" | "list">("grid")
  const [catScrolled, setCatScrolled] = useState({ left: false, right: true })
  const [barPinned,   setBarPinned]   = useState(false)
  const [barStyle,    setBarStyle]    = useState<React.CSSProperties>({})
  const [barHeight,   setBarHeight]   = useState(0)

  const catRef  = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const barEl   = useRef<HTMLDivElement>(null)

  // Sync category from URL (sidebar links)
  useEffect(() => {
    const cat = searchParams.get("category")
    setCategory(cat ?? "All")
  }, [searchParams])

  // Sticky bar via JS (position: sticky broken by overflow-hidden in AppShell)
  useEffect(() => {
    const main = document.getElementById("main-scroll")
    if (!main) return

    const measure = () => {
      if (barEl.current) setBarHeight(barEl.current.offsetHeight)
    }
    measure()

    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0
      const mainTop    = main.getBoundingClientRect().top
      const shouldPin  = heroBottom <= mainTop
      setBarPinned(shouldPin)
      if (shouldPin) {
        const r = main.getBoundingClientRect()
        setBarStyle({ left: r.left, right: window.innerWidth - r.right, top: r.top, width: r.width })
      }
    }

    const onResize = () => { onScroll(); measure() }
    main.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)
    return () => { main.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onResize) }
  }, [])

  const scrollCat = (dir: "left" | "right") => {
    const el = catRef.current
    if (!el) return
    el.scrollBy({ left: dir === "left" ? -el.clientWidth : el.clientWidth, behavior: "smooth" })
  }

  const onCatScroll = () => {
    const el = catRef.current
    if (!el) return
    setCatScrolled({ left: el.scrollLeft > 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
  }

  // ── Filter + sort ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = services.filter(s => {
      if (search) {
        const q = search.toLowerCase()
        if (!s.title.toLowerCase().includes(q) &&
            !s.description.toLowerCase().includes(q) &&
            !(s.user.name?.toLowerCase().includes(q)) &&
            !(s.city?.toLowerCase().includes(q))) return false
      }
      if (category !== "All" && s.category !== category) return false
      if (priceType !== "all" && s.priceType !== priceType) return false
      return true
    })

    if (sort === "price_asc")  list = [...list].sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === "price_desc") list = [...list].sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    return list
  }, [services, search, category, priceType, sort])

  const activeFilterCount = [
    category !== "All", priceType !== "all", sort !== "recent", !!search,
  ].filter(Boolean).length

  const clearAll = () => { setSearch(""); setCategory("All"); setPriceType("all"); setSort("recent") }

  const catInfo = CATEGORIES.find(c => c.value === category)

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-background">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div ref={heroRef} className="relative text-white overflow-hidden" style={{ minHeight: 300 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=85&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-teal-950/50 via-transparent to-blue-950/40" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">

          {/* Top row */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-white/60 border border-white/20 rounded-full px-3 py-1 backdrop-blur-sm bg-white/5">
                  <CheckCircle2 className="h-3 w-3" /> Verified Professionals
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg">Skill Marketplace</h1>
              <p className="text-white/60 mt-2 text-sm">Hire verified professionals from your corporate network.</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {!isPremium && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs backdrop-blur-sm">
                  <span className="text-amber-300 font-medium">{myCount}/{skillsLimit} listed</span>
                  <Link href="/membership" className="flex items-center gap-1 text-amber-400 font-bold hover:underline">
                    <Zap className="h-3 w-3" />Upgrade
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-medium">
                  <Link href="/my-services"><Wrench className="h-4 w-4 mr-1.5" /> My Services</Link>
                </Button>
                <Button asChild className="bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg">
                  <Link href="/skills/new"><Plus className="h-4 w-4 mr-1.5" /> Offer a Skill</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-8">
            <div>
              <p className="text-3xl font-bold tabular-nums">{totalServices}</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Services Listed</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-3xl font-bold">{CATEGORIES.length - 1}</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Categories</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Verified</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search skills, professionals, categories…"
              className="w-full h-12 pl-11 pr-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky bar: category strip + filters ──────────────────────────────── */}
      {barPinned && <div style={{ height: barHeight }} />}
      <div
        ref={barEl}
        className="z-30 bg-background shadow-sm"
        style={barPinned ? { position: "fixed", ...barStyle } : { position: "sticky", top: 0 }}
      >
        {/* Category strip */}
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
            <button
              onClick={() => scrollCat("left")}
              disabled={!catScrolled.left}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-20"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div
              ref={catRef}
              onScroll={onCatScroll}
              className="flex-1 overflow-x-auto scrollbar-hide"
            >
              <div className="flex">
                {CATEGORIES.map(cat => {
                  const count    = services.filter(s => cat.value === "All" || s.category === cat.value).length
                  const isActive = category === cat.value
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={cn(
                        "flex flex-col items-center gap-1.5 py-3 flex-1 min-w-[80px] px-2 border-b-2 transition-all text-center",
                        isActive
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", cat.iconBg)}>
                        <cat.Icon className={cn("h-4 w-4", cat.iconColor)} />
                      </div>
                      <span className="text-[11px] font-medium whitespace-nowrap leading-tight">{cat.label}</span>
                      <span className="text-[10px] text-muted-foreground">{count}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <button
              onClick={() => scrollCat("right")}
              disabled={!catScrolled.right}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors disabled:opacity-20"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center gap-3">

            {/* Price type tabs */}
            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 text-xs">
              {[["all","All"],["HOURLY","Hourly"],["FIXED","Fixed"],["NEGOTIABLE","Negotiable"]].map(([v, l]) => (
                <button key={v} onClick={() => setPriceType(v)}
                  className={cn("px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap",
                    priceType === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}>{l}</button>
              ))}
            </div>

            <div className="w-px h-5 bg-border" />

            {/* Sort */}
            <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 text-xs">
              {[["recent","Recent"],["price_asc","Price ↑"],["price_desc","Price ↓"]].map(([v, l]) => (
                <button key={v} onClick={() => setSort(v)}
                  className={cn("px-3 py-1.5 rounded-md font-medium transition-all whitespace-nowrap",
                    sort === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}>{l}</button>
              ))}
            </div>

            <div className="ml-auto flex items-center gap-2">
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" /> Clear ({activeFilterCount})
                </button>
              )}
              {/* View toggle */}
              <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
                <button onClick={() => setView("grid")} className={cn("p-1.5 rounded-md transition-all", view === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => setView("list")} className={cn("p-1.5 rounded-md transition-all", view === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Result header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-semibold">
              {category === "All" ? "All Services" : `${catInfo?.label ?? category} Services`}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} professionals available</p>
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {category !== "All" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                {catInfo?.label} <button onClick={() => setCategory("All")}><X className="h-3 w-3" /></button>
              </span>
            )}
            {priceType !== "all" && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                {priceType} <button onClick={() => setPriceType("all")}><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No services found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm">Try broadening your search or clearing filters.</p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={clearAll}>Clear filters</Button>
              <Button asChild><Link href="/skills/new"><Plus className="h-4 w-4 mr-1.5" />Offer a Skill</Link></Button>
            </div>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(s => <ServiceCard key={s.id} service={s} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => <ServiceRow key={s.id} service={s} />)}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Service card (grid) ────────────────────────────────────────────────────────

function ServiceCard({ service: s }: { service: ServiceItem }) {
  const cat = CATEGORIES.find(c => c.value === s.category)
  const img = parsePortfolio(s.portfolio)[0]

  return (
    <Link href={`/services/${s.id}`} className="group block h-full">
      <div className="h-full flex flex-col rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-200">
        {/* Cover — fixed height */}
        <div className="relative h-40 shrink-0 bg-muted overflow-hidden">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className={cn("w-full h-full flex items-center justify-center", cat?.iconBg ?? "bg-muted")}>
              {cat && <cat.Icon className={cn("h-12 w-12 opacity-30", cat.iconColor)} />}
            </div>
          )}
          {cat && (
            <div className={cn("absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold backdrop-blur-sm", cat.iconBg, cat.iconColor)}>
              <cat.Icon className="h-3 w-3" />{cat.label}
            </div>
          )}
          <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg text-[10px] font-bold bg-black/60 text-white backdrop-blur-sm">
            {s.priceType === "NEGOTIABLE" ? "Negotiable" : s.price ? `₹${s.price.toLocaleString()}${PRICE_TYPE_LABEL[s.priceType] ?? ""}` : "Free"}
          </div>
        </div>

        {/* Body — flex-1 so all cards stretch to same row height */}
        <div className="flex flex-col flex-1 p-4">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1.5">{s.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{s.description}</p>

          {/* Author — always at bottom */}
          <div className="flex items-center gap-2.5 pt-3 mt-3 border-t border-border">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarImage src={s.user.image ?? ""} />
              <AvatarFallback className="text-[10px]">{initials(s.user.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{s.user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{s.user.jobTitle ?? s.user.company?.name ?? ""}</p>
            </div>
            {s.city && (
              <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground shrink-0">
                <MapPin className="h-3 w-3" />{s.city}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Service row (list) ─────────────────────────────────────────────────────────

function ServiceRow({ service: s }: { service: ServiceItem }) {
  const cat = CATEGORIES.find(c => c.value === s.category)
  const img = parsePortfolio(s.portfolio)[0]

  return (
    <Link href={`/services/${s.id}`} className="group block">
      <div className="flex gap-4 p-4 rounded-2xl border border-border bg-card hover:shadow-md hover:border-primary/30 transition-all">
        {/* Thumbnail */}
        <div className="h-20 w-24 rounded-xl bg-muted overflow-hidden shrink-0">
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={s.title} className="w-full h-full object-cover" />
          ) : (
            <div className={cn("w-full h-full flex items-center justify-center", cat?.iconBg)}>
              {cat && <cat.Icon className={cn("h-8 w-8 opacity-40", cat.iconColor)} />}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                {cat && (
                  <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md", cat.iconBg, cat.iconColor)}>
                    <cat.Icon className="h-3 w-3" />{cat.label}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{s.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{s.description}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-sm">
                {s.priceType === "NEGOTIABLE" ? "Negotiate" : s.price ? `₹${s.price.toLocaleString()}` : "Free"}
              </p>
              {s.priceType !== "NEGOTIABLE" && (
                <p className="text-[10px] text-muted-foreground">{PRICE_TYPE_LABEL[s.priceType]}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-3">
            <Avatar className="h-6 w-6 shrink-0">
              <AvatarImage src={s.user.image ?? ""} />
              <AvatarFallback className="text-[10px]">{initials(s.user.name)}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium">{s.user.name}</span>
            {s.user.company && <span className="text-xs text-muted-foreground">· {s.user.company.name}</span>}
            {s.city && (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground">
                <MapPin className="h-3 w-3" />{s.city}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
