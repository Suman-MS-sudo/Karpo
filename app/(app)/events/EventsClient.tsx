"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import {
  Search, Plus, X, LayoutGrid, List, Package,
  Calendar, MapPin, Users, Clock, Bookmark, BookmarkCheck,
  TrendingUp, Sparkles, Globe, Video, ChevronDown, Zap,
  ArrowUpDown, Filter, LayoutDashboard, ChevronLeft, ChevronRight, Navigation,
  Mountain, Trophy, Handshake, Palette, MoreHorizontal,
  Music, Mic2, UtensilsCrossed, Heart, Cpu, Hammer, Gamepad2,
  Clapperboard, Dumbbell, Plane,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EventItem {
  id:              string
  title:           string
  description:     string
  category:        string
  date:            string   // ISO
  location:        string
  fee:             number
  maxParticipants: number | null
  images:          string[]
  tags:            string[]
  isBoosted:       boolean
  isOnline:        boolean
  requiresApproval:boolean
  rsvpCount:       number
  rsvps:           Array<{ userId: string; name: string | null; image: string | null; avatarUrl: string | null }>
  organizer:       { id: string; name: string | null; image: string | null; avatarUrl: string | null; company: { name: string } | null }
  hasRsvped:       boolean
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: "All",        label: "All",         Icon: LayoutDashboard, iconBg: "bg-slate-100 dark:bg-white/10",          iconColor: "text-slate-600 dark:text-white"           },
  { value: "TREK",       label: "Trek",         Icon: Mountain,        iconBg: "bg-emerald-100 dark:bg-emerald-500/20",  iconColor: "text-emerald-600 dark:text-emerald-400"  },
  { value: "SPORTS",     label: "Sports",       Icon: Trophy,          iconBg: "bg-blue-100 dark:bg-blue-500/20",        iconColor: "text-blue-600 dark:text-blue-400"        },
  { value: "NETWORKING", label: "Networking",   Icon: Handshake,       iconBg: "bg-violet-100 dark:bg-violet-500/20",    iconColor: "text-violet-600 dark:text-violet-400"    },
  { value: "MUSIC",      label: "Music",        Icon: Music,           iconBg: "bg-purple-100 dark:bg-purple-500/20",    iconColor: "text-purple-600 dark:text-purple-400"    },
  { value: "COMEDY",     label: "Standup",      Icon: Mic2,            iconBg: "bg-orange-100 dark:bg-orange-500/20",    iconColor: "text-orange-600 dark:text-orange-400"    },
  { value: "FOOD",       label: "Food",         Icon: UtensilsCrossed, iconBg: "bg-yellow-100 dark:bg-yellow-500/20",    iconColor: "text-yellow-600 dark:text-yellow-400"    },
  { value: "WELLNESS",   label: "Wellness",     Icon: Heart,           iconBg: "bg-pink-100 dark:bg-pink-500/20",        iconColor: "text-pink-600 dark:text-pink-400"        },
  { value: "TECH",       label: "Tech",         Icon: Cpu,             iconBg: "bg-cyan-100 dark:bg-cyan-500/20",        iconColor: "text-cyan-600 dark:text-cyan-400"        },
  { value: "WORKSHOP",   label: "Workshop",     Icon: Hammer,          iconBg: "bg-slate-100 dark:bg-slate-500/20",      iconColor: "text-slate-600 dark:text-slate-400"      },
  { value: "GAMING",     label: "Gaming",       Icon: Gamepad2,        iconBg: "bg-indigo-100 dark:bg-indigo-500/20",    iconColor: "text-indigo-600 dark:text-indigo-400"    },
  { value: "MOVIE",      label: "Movie",        Icon: Clapperboard,    iconBg: "bg-red-100 dark:bg-red-500/20",          iconColor: "text-red-600 dark:text-red-400"          },
  { value: "FITNESS",    label: "Fitness",      Icon: Dumbbell,        iconBg: "bg-lime-100 dark:bg-lime-500/20",        iconColor: "text-lime-600 dark:text-lime-400"        },
  { value: "HOBBY",      label: "Hobbies",      Icon: Palette,         iconBg: "bg-rose-100 dark:bg-rose-500/20",        iconColor: "text-rose-600 dark:text-rose-400"        },
  { value: "TRAVEL",     label: "Travel",       Icon: Plane,           iconBg: "bg-sky-100 dark:bg-sky-500/20",          iconColor: "text-sky-600 dark:text-sky-400"          },
  { value: "OTHER",      label: "Other",        Icon: MoreHorizontal,  iconBg: "bg-amber-100 dark:bg-amber-500/20",      iconColor: "text-amber-600 dark:text-amber-400"      },
]

const CAT_COLORS: Record<string, { bg: string; text: string; dot: string; gradient: string }> = {
  TREK:       { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500", gradient: "from-emerald-800 to-teal-900"    },
  SPORTS:     { bg: "bg-blue-100 dark:bg-blue-900/40",       text: "text-blue-700 dark:text-blue-300",       dot: "bg-blue-500",    gradient: "from-blue-800 to-indigo-900"     },
  NETWORKING: { bg: "bg-violet-100 dark:bg-violet-900/40",   text: "text-violet-700 dark:text-violet-300",   dot: "bg-violet-500",  gradient: "from-violet-800 to-purple-900"   },
  MUSIC:      { bg: "bg-purple-100 dark:bg-purple-900/40",   text: "text-purple-700 dark:text-purple-300",   dot: "bg-purple-500",  gradient: "from-purple-800 to-fuchsia-900"  },
  COMEDY:     { bg: "bg-orange-100 dark:bg-orange-900/40",   text: "text-orange-700 dark:text-orange-300",   dot: "bg-orange-500",  gradient: "from-orange-800 to-red-900"      },
  FOOD:       { bg: "bg-yellow-100 dark:bg-yellow-900/40",   text: "text-yellow-700 dark:text-yellow-300",   dot: "bg-yellow-500",  gradient: "from-yellow-700 to-amber-900"    },
  WELLNESS:   { bg: "bg-pink-100 dark:bg-pink-900/40",       text: "text-pink-700 dark:text-pink-300",       dot: "bg-pink-500",    gradient: "from-pink-800 to-rose-900"       },
  TECH:       { bg: "bg-cyan-100 dark:bg-cyan-900/40",       text: "text-cyan-700 dark:text-cyan-300",       dot: "bg-cyan-500",    gradient: "from-cyan-800 to-blue-900"       },
  WORKSHOP:   { bg: "bg-slate-100 dark:bg-slate-800/60",     text: "text-slate-700 dark:text-slate-300",     dot: "bg-slate-500",   gradient: "from-slate-700 to-slate-900"     },
  GAMING:     { bg: "bg-indigo-100 dark:bg-indigo-900/40",   text: "text-indigo-700 dark:text-indigo-300",   dot: "bg-indigo-500",  gradient: "from-indigo-800 to-violet-900"   },
  MOVIE:      { bg: "bg-red-100 dark:bg-red-900/40",         text: "text-red-700 dark:text-red-300",         dot: "bg-red-500",     gradient: "from-red-800 to-rose-900"        },
  FITNESS:    { bg: "bg-lime-100 dark:bg-lime-900/40",       text: "text-lime-700 dark:text-lime-300",       dot: "bg-lime-500",    gradient: "from-lime-700 to-green-900"      },
  HOBBY:      { bg: "bg-rose-100 dark:bg-rose-900/40",       text: "text-rose-700 dark:text-rose-300",       dot: "bg-rose-500",    gradient: "from-rose-800 to-pink-900"       },
  TRAVEL:     { bg: "bg-sky-100 dark:bg-sky-900/40",         text: "text-sky-700 dark:text-sky-300",         dot: "bg-sky-500",     gradient: "from-sky-700 to-blue-900"        },
  OTHER:      { bg: "bg-amber-100 dark:bg-amber-900/40",     text: "text-amber-700 dark:text-amber-300",     dot: "bg-amber-500",   gradient: "from-amber-800 to-orange-900"    },
}

const DATE_FILTERS = [
  { value: "all",     label: "Any date"     },
  { value: "today",   label: "Today"        },
  { value: "weekend", label: "This weekend" },
  { value: "week",    label: "This week"    },
  { value: "month",   label: "This month"   },
]

const SORT_OPTIONS = [
  { value: "date",       label: "Soonest first"      },
  { value: "popular",    label: "Most popular"        },
  { value: "price_asc",  label: "Price: Low → High"   },
  { value: "price_desc", label: "Price: High → Low"   },
]

const CITIES = [
  { name: "Bengaluru",  state: "Karnataka"      },
  { name: "Hyderabad",  state: "Telangana"      },
  { name: "Mumbai",     state: "Maharashtra"    },
  { name: "Delhi",      state: "NCR"            },
  { name: "Pune",       state: "Maharashtra"    },
  { name: "Chennai",    state: "Tamil Nadu"     },
  { name: "Kolkata",    state: "West Bengal"    },
  { name: "Ahmedabad",  state: "Gujarat"        },
  { name: "Jaipur",     state: "Rajasthan"      },
  { name: "Kochi",      state: "Kerala"         },
  { name: "Chandigarh", state: "Punjab"         },
  { name: "Coimbatore", state: "Tamil Nadu"     },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtMon(d: Date)  { return d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase() }
function fmtDay(d: Date)  { return d.getDate() }
function fmtDate(d: Date) { return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }) }
function fmtTime(d: Date) { return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) }
function fmtFee(fee: number) { return fee === 0 ? "Free" : `₹${fee.toLocaleString("en-IN")}` }
function getInitials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase()
}

function isToday(d: Date)   { const n = new Date(); return d.toDateString() === n.toDateString() }
function isWeekend(d: Date) {
  const now = new Date()
  const day = now.getDay()
  const sat = new Date(now); sat.setDate(now.getDate() + (6 - day))
  const sun = new Date(now); sun.setDate(now.getDate() + (7 - day))
  sat.setHours(0,0,0,0); sun.setHours(23,59,59,999)
  return d >= sat && d <= sun
}
function isThisWeek(d: Date) {
  const now = new Date(); const end = new Date(now); end.setDate(now.getDate() + 7)
  return d >= now && d <= end
}
function isThisMonth(d: Date) {
  const now = new Date()
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

// ── Component ──────────────────────────────────────────────────────────────────

interface Props {
  events:          EventItem[]
  totalEvents:     number
  totalRsvps:      number
  isPremium:       boolean
  myEventsCount:   number
  eventsLimit:     number
}

export function EventsClient({ events, totalEvents, totalRsvps, isPremium, myEventsCount, eventsLimit }: Props) {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const [search,      setSearch]      = useState("")
  const [category,    setCategory]    = useState(() => searchParams.get("category") ?? "All")
  const [dateFilter,  setDateFilter]  = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")   // all | free | paid
  const [formatFilter,setFormatFilter]= useState("all")   // all | online | inperson
  const [sort,        setSort]        = useState("date")
  const [view,        setView]        = useState<"grid" | "list">("grid")
  const [bookmarks,   setBookmarks]   = useState<Set<string>>(new Set())
  const [showFilters, setShowFilters] = useState(false)
  const [sortOpen,    setSortOpen]    = useState(false)
  const [cityFilter,      setCityFilter]      = useState<string>("Bengaluru")
  const [cityOpen,        setCityOpen]        = useState(false)
  const [locationFilter, setLocationFilter] = useState<string | null>(null) // detected city/area
  const [locationLoading, setLocationLoading] = useState(false)
  const [locationError,   setLocationError]   = useState<string | null>(null)
  const [catScrolled, setCatScrolled] = useState({ left: false, right: true })
  const [barPinned,   setBarPinned]   = useState(false)
  const [barStyle,    setBarStyle]    = useState<React.CSSProperties>({})
  const [barHeight,   setBarHeight]   = useState(0)
  const catRef  = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const barEl   = useRef<HTMLDivElement>(null)

  // Sync category from URL (sidebar links use ?category=X)
  useEffect(() => {
    const cat = searchParams.get("category")
    setCategory(cat ?? "All")
  }, [searchParams])

  // Sync date filter from URL (?date=today etc.)
  useEffect(() => {
    const d = searchParams.get("date")
    if (d) setDateFilter(d)
    const p = searchParams.get("price")
    if (p) setPriceFilter(p)
  }, [searchParams])

  useEffect(() => {
    const main = document.getElementById("main-scroll")
    if (!main) return

    const updateBarStyle = () => {
      const rect = main.getBoundingClientRect()
      setBarStyle({ left: rect.left, right: window.innerWidth - rect.right, top: rect.top })
      if (barEl.current) setBarHeight(barEl.current.offsetHeight)
    }

    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0
      const mainTop    = main.getBoundingClientRect().top
      const shouldPin  = heroBottom <= mainTop
      setBarPinned(shouldPin)
      if (shouldPin) updateBarStyle()
    }

    updateBarStyle()
    window.addEventListener("resize", updateBarStyle)
    main.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      main.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", updateBarStyle)
    }
  }, [])

  const scrollCat = (dir: "left" | "right") => {
    const el = catRef.current
    if (!el) return
    // scroll by the visible container width (shows next/prev 10 items)
    el.scrollBy({ left: dir === "left" ? -el.clientWidth : el.clientWidth, behavior: "smooth" })
  }

  const onCatScroll = () => {
    const el = catRef.current
    if (!el) return
    setCatScrolled({
      left:  el.scrollLeft > 8,
      right: el.scrollLeft < el.scrollWidth - el.clientWidth - 8,
    })
  }

  const requestLocation = async () => {
    if (!navigator.geolocation) { setLocationError("Geolocation not supported"); return }
    setLocationLoading(true); setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`)
          const data = await res.json()
          const area = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district
                    || data.address?.city    || data.address?.town         || data.address?.state
          setLocationFilter(area ?? "Nearby")
        } catch { setLocationError("Could not detect location") }
        finally  { setLocationLoading(false) }
      },
      () => { setLocationError("Location access denied"); setLocationLoading(false) },
      { timeout: 8000 }
    )
  }

  const toggleBookmark = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
    setBookmarks(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // ── Filtering ────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = events.filter(ev => {
      const d = new Date(ev.date)
      if (search && !ev.title.toLowerCase().includes(search.toLowerCase()) &&
          !ev.description.toLowerCase().includes(search.toLowerCase()) &&
          !ev.location.toLowerCase().includes(search.toLowerCase()) &&
          !ev.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
      if (category !== "All" && ev.category !== category) return false
      if (dateFilter === "today"   && !isToday(d))     return false
      if (dateFilter === "weekend" && !isWeekend(d))   return false
      if (dateFilter === "week"    && !isThisWeek(d))  return false
      if (dateFilter === "month"   && !isThisMonth(d)) return false
      if (priceFilter === "free"   && ev.fee !== 0)    return false
      if (priceFilter === "paid"   && ev.fee === 0)    return false
      if (formatFilter === "online"   && !ev.isOnline) return false
      if (formatFilter === "inperson" && ev.isOnline)  return false
      if (cityFilter     && cityFilter !== "All" && !ev.location.toLowerCase().includes(cityFilter.toLowerCase())) return false
      if (locationFilter && !ev.location.toLowerCase().includes(locationFilter.toLowerCase())) return false
      return true
    })

    list = [...list].sort((a, b) => {
      if (sort === "date")       return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sort === "popular")    return b.rsvpCount - a.rsvpCount
      if (sort === "price_asc")  return a.fee - b.fee
      if (sort === "price_desc") return b.fee - a.fee
      return 0
    })

    return list
  }, [events, search, category, dateFilter, priceFilter, formatFilter, sort, cityFilter, locationFilter])

  const spotlight  = filtered.find(e => e.isBoosted) ?? filtered[0]
  const gridEvents = spotlight ? filtered.filter(e => e.id !== spotlight.id) : []

  // Active filter count (excluding category since it's a tab)
  const activeFilters = [
    dateFilter   !== "all" ? dateFilter   : null,
    priceFilter  !== "all" ? priceFilter  : null,
    formatFilter !== "all" ? formatFilter : null,
    search         ? "search"   : null,
    locationFilter ? "location" : null,
  ].filter(Boolean)

  const clearAll = () => {
    setSearch(""); setDateFilter("all"); setPriceFilter("all"); setFormatFilter("all"); setLocationFilter(null)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-full bg-background">

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div ref={heroRef} className="relative text-white overflow-hidden" style={{ minHeight: 320 }}>
        {/* Background image — professional event/conference crowd */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1920&q=85&auto=format&fit=crop"
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
          aria-hidden
        />
        {/* Vibrant Gen Z overlay — keep the neon colors visible but text readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-violet-950/40 via-transparent to-pink-950/30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8">

          {/* Top row */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-widest uppercase text-white/60 border border-white/20 rounded-full px-3 py-1 backdrop-blur-sm bg-white/5">
                  <Sparkles className="h-3 w-3" /> Corporate Events
                </span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight drop-shadow-lg">Events &amp; Communities</h1>
              <p className="text-white/60 mt-2 text-sm">Treks, sports, networking &amp; hobby clubs — only verified professionals.</p>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {!isPremium && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs backdrop-blur-sm">
                  <span className="text-amber-300 font-medium">{myEventsCount}/{eventsLimit} events</span>
                  <Link href="/membership" className="flex items-center gap-1 text-amber-400 font-bold hover:underline">
                    <Zap className="h-3 w-3" />Upgrade
                  </Link>
                </div>
              )}
              <Button asChild variant="outline" className="border-white/30 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm font-medium">
                <Link href="/my-events"><Package className="h-4 w-4 mr-1.5" /> My Events</Link>
              </Button>
              <Button asChild className="bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg backdrop-blur-sm">
                <Link href="/events/new"><Plus className="h-4 w-4 mr-1.5" /> Create Event</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-8 mb-8">
            <div>
              <p className="text-3xl font-bold tabular-nums">{totalEvents}</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Upcoming</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-3xl font-bold tabular-nums">{totalRsvps.toLocaleString()}</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Total RSVPs</p>
            </div>
            <div className="w-px h-10 bg-white/15" />
            <div>
              <p className="text-3xl font-bold">100%</p>
              <p className="text-xs text-white/50 mt-0.5 uppercase tracking-wide">Verified</p>
            </div>
          </div>

          {/* Search + Location row */}
          <div className="flex gap-2 items-center pb-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search events, venues, tags…"
                className="w-full h-12 pl-11 pr-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white/15 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Near me button */}
            <button
              onClick={requestLocation}
              disabled={locationLoading}
              title={locationFilter ? `Filtering: ${locationFilter}` : "Find events near me"}
              className={cn(
                "h-12 px-4 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all whitespace-nowrap backdrop-blur-md",
                locationFilter
                  ? "bg-blue-500/30 border-blue-400/50 text-blue-200 hover:bg-blue-500/40"
                  : "bg-white/10 border-white/20 text-white/80 hover:bg-white/20"
              )}
            >
              <Navigation className={cn("h-4 w-4", locationLoading && "animate-pulse", locationFilter && "fill-current")} />
              {locationLoading ? "Locating…" : locationFilter ? locationFilter : "Near me"}
              {locationFilter && (
                <button onClick={e => { e.stopPropagation(); setLocationFilter(null) }} className="ml-1 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              )}
            </button>
          </div>

          {/* Location error */}
          {locationError && (
            <p className="text-xs text-red-400/80 mt-2">{locationError}</p>
          )}

        </div>
      </div>

      {/* ── Category icon strip + Filter bar ────────────────────────────────── */}
      {barPinned && <div style={{ height: barHeight }} />}
      <div
        ref={barEl}
        className="z-30 bg-background shadow-sm"
        style={barPinned ? { position: "fixed", ...barStyle } : { position: "sticky", top: 0 }}
      >
        {/* Category icon strip — 10 visible at a time, page with arrows */}
        <div className="border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          {/* Left arrow */}
          <button
            onClick={() => scrollCat("left")}
            disabled={!catScrolled.left}
            className="shrink-0 w-8 self-stretch flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Fixed 10-slot window */}
          <div ref={catRef} onScroll={onCatScroll} className="flex-1 overflow-x-auto scrollbar-hide">
            <div className="flex">
              {CATEGORIES.map(cat => {
                const count    = events.filter(e => cat.value === "All" || e.category === cat.value).length
                const isActive = category === cat.value
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 py-3 relative transition-all duration-150 group",
                      "flex-1 min-w-[80px]",
                      isActive ? "opacity-100" : "opacity-40 hover:opacity-75"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-150",
                      isActive ? cn(cat.iconBg, "ring-2 ring-border scale-110 shadow-sm") : cn(cat.iconBg, "group-hover:scale-105")
                    )}>
                      <cat.Icon className={cn("h-4.5 w-4.5", cat.iconColor)} style={{ width: 18, height: 18 }} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className={cn("text-[11px] font-semibold whitespace-nowrap", isActive ? "text-foreground" : "text-muted-foreground")}>
                      {cat.label}
                    </span>
                    <span className={cn("text-[10px] tabular-nums leading-none", isActive ? "text-muted-foreground" : "text-muted-foreground/40")}>
                      {count}
                    </span>
                    <div className={cn("absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-primary-600 transition-all duration-150", isActive ? "w-8" : "w-0")} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right arrow */}
          <button
            onClick={() => scrollCat("right")}
            disabled={!catScrolled.right}
            className="shrink-0 w-8 self-stretch flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          </div>{/* end max-w-7xl */}
        </div>

        {/* ── Filter bar ─────────────────────────────────────────────────────── */}
        <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center gap-2 flex-wrap">

            {/* City picker */}
            <div className="relative">
              <button
                onClick={() => setCityOpen(o => !o)}
                className="flex items-center gap-1.5 h-8 pl-2.5 pr-3 rounded-lg border border-border hover:border-foreground/30 bg-background text-sm font-medium transition-all group"
              >
                <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span className="text-foreground">{cityFilter}</span>
                <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform ml-0.5", cityOpen && "rotate-180")} />
              </button>

              {cityOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCityOpen(false)} />
                  <div className="absolute left-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden w-64">
                    <div className="px-3 pt-3 pb-2 border-b border-border">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">Select City</p>
                    </div>
                    <div className="grid grid-cols-2 gap-0.5 p-2 max-h-64 overflow-y-auto">
                      {CITIES.map(city => (
                        <button
                          key={city.name}
                          onClick={() => { setCityFilter(city.name); setCityOpen(false) }}
                          className={cn(
                            "flex flex-col items-start px-3 py-2 rounded-lg text-left transition-all",
                            cityFilter === city.name
                              ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                              : "hover:bg-muted text-foreground"
                          )}
                        >
                          <span className="text-sm font-medium leading-tight">{city.name}</span>
                          <span className="text-[10px] text-muted-foreground">{city.state}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-px h-5 bg-border" />

            {/* Date quick filters */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {DATE_FILTERS.map(f => (
                <button
                  key={f.value}
                  onClick={() => setDateFilter(f.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all",
                    dateFilter === f.value
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Price filter */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {[["all","All"],["free","Free"],["paid","Paid"]].map(([v, l]) => (
                <button key={v} onClick={() => setPriceFilter(v)}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    priceFilter === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}>{l}</button>
              ))}
            </div>

            {/* Format filter */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
              {[["all","All formats"],["inperson","In-person"],["online","Online"]].map(([v, l]) => (
                <button key={v} onClick={() => setFormatFilter(v)}
                  className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                    formatFilter === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}>{l}</button>
              ))}
            </div>

            {/* Location / Near me filter */}
            <button
              onClick={locationFilter ? () => setLocationFilter(null) : requestLocation}
              disabled={locationLoading}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap",
                locationFilter
                  ? "bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              )}
            >
              <Navigation className={cn("h-3.5 w-3.5", locationLoading && "animate-pulse", locationFilter && "fill-current")} />
              {locationLoading ? "Locating…" : locationFilter ? `Near ${locationFilter}` : "Near me"}
              {locationFilter && <X className="h-3 w-3 ml-0.5" />}
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Result count */}
            <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
              {filtered.length} event{filtered.length !== 1 ? "s" : ""}
            </span>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:border-foreground/20 transition-all"
              >
                <ArrowUpDown className="h-3.5 w-3.5" />
                {SORT_OPTIONS.find(s => s.value === sort)?.label}
                <ChevronDown className="h-3 w-3" />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden min-w-[180px]">
                    {SORT_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => { setSort(opt.value); setSortOpen(false) }}
                        className={cn("w-full text-left px-3.5 py-2.5 text-sm transition-colors hover:bg-muted",
                          sort === opt.value ? "text-primary-600 font-medium bg-primary-50 dark:bg-primary-950/30" : "text-foreground"
                        )}
                      >{opt.label}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

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

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Active:</span>
              {search && (
                <span className="inline-flex items-center gap-1 text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
                  "{search}" <button onClick={() => setSearch("")}><X className="h-3 w-3 ml-0.5" /></button>
                </span>
              )}
              {dateFilter !== "all" && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted text-foreground px-2 py-0.5 rounded-full capitalize">
                  {DATE_FILTERS.find(f => f.value === dateFilter)?.label}
                  <button onClick={() => setDateFilter("all")}><X className="h-3 w-3 ml-0.5" /></button>
                </span>
              )}
              {priceFilter !== "all" && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted text-foreground px-2 py-0.5 rounded-full capitalize">
                  {priceFilter} <button onClick={() => setPriceFilter("all")}><X className="h-3 w-3 ml-0.5" /></button>
                </span>
              )}
              {formatFilter !== "all" && (
                <span className="inline-flex items-center gap-1 text-xs bg-muted text-foreground px-2 py-0.5 rounded-full">
                  {formatFilter === "online" ? "Online" : "In-person"}
                  <button onClick={() => setFormatFilter("all")}><X className="h-3 w-3 ml-0.5" /></button>
                </span>
              )}
              {locationFilter && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  <Navigation className="h-3 w-3" /> Near {locationFilter}
                  <button onClick={() => setLocationFilter(null)}><X className="h-3 w-3 ml-0.5" /></button>
                </span>
              )}
              <button onClick={clearAll} className="text-xs text-muted-foreground hover:text-red-500 underline transition-colors">Clear all</button>
            </div>
          )}
        </div>
      </div>
      </div>{/* end bar wrapper */}

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-5 text-4xl">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No events match your filters</h3>
            <p className="text-muted-foreground mb-6 max-w-sm text-sm">Try broadening your search or clearing some filters.</p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={clearAll}>Clear filters</Button>
              <Button asChild><Link href="/events/new"><Plus className="h-4 w-4 mr-1.5" />Create one</Link></Button>
            </div>
          </div>
        ) : (
          <div className="space-y-10">

            {/* ── Spotlight ──────────────────────────────────────────────────── */}
            {spotlight && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4 text-primary-600" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Featured</h2>
                </div>
                <SpotlightCard event={spotlight} bookmarks={bookmarks} onBookmark={toggleBookmark} />
              </section>
            )}

            {/* ── Bookmarked (if any) ────────────────────────────────────────── */}
            {bookmarks.size > 0 && (() => {
              const saved = filtered.filter(e => bookmarks.has(e.id) && e.id !== spotlight?.id)
              if (saved.length === 0) return null
              return (
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <BookmarkCheck className="h-4 w-4 text-amber-500" />
                    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Saved</h2>
                    <span className="text-xs text-muted-foreground">({saved.length})</span>
                  </div>
                  <div className={cn(view === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    : "space-y-3"
                  )}>
                    {saved.map(ev => view === "grid"
                      ? <GridCard key={ev.id} event={ev} bookmarks={bookmarks} onBookmark={toggleBookmark} />
                      : <ListCard key={ev.id} event={ev} bookmarks={bookmarks} onBookmark={toggleBookmark} />
                    )}
                  </div>
                </section>
              )
            })()}

            {/* ── All events grid/list ───────────────────────────────────────── */}
            {gridEvents.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="h-4 w-4 text-primary-600" />
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {category === "All" ? "All Upcoming" : `${category} Events`}
                  </h2>
                  <span className="text-xs text-muted-foreground">({gridEvents.length})</span>
                </div>

                {view === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {gridEvents.map(ev => <GridCard key={ev.id} event={ev} bookmarks={bookmarks} onBookmark={toggleBookmark} />)}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {gridEvents.map(ev => <ListCard key={ev.id} event={ev} bookmarks={bookmarks} onBookmark={toggleBookmark} />)}
                  </div>
                )}
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// ── Spotlight Card ─────────────────────────────────────────────────────────────

function SpotlightCard({ event: ev, bookmarks, onBookmark }: {
  event: EventItem
  bookmarks: Set<string>
  onBookmark: (id: string, e: React.MouseEvent) => void
}) {
  const cc    = CAT_COLORS[ev.category]
  const eDate = new Date(ev.date)
  const saved = bookmarks.has(ev.id)

  return (
    <Link href={`/events/${ev.id}`} className="group block">
      <div className="relative rounded-2xl overflow-hidden min-h-[340px] lg:min-h-[400px] flex bg-slate-900">
        {ev.images[0] ? (
          <Image src={ev.images[0]} alt={ev.title} fill className="object-cover opacity-45 group-hover:opacity-55 transition-opacity duration-500" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${cc?.gradient ?? "from-slate-700 to-slate-900"} opacity-70`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/70 to-transparent" />

        {/* Bookmark */}
        <button
          onClick={e => onBookmark(ev.id, e)}
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all"
        >
          {saved
            ? <BookmarkCheck className="h-4 w-4 text-amber-400" />
            : <Bookmark className="h-4 w-4 text-white" />
          }
        </button>

        <div className="relative z-10 flex flex-col justify-end p-8 lg:p-10 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {cc && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cc.bg} ${cc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} /> {ev.category}
              </span>
            )}
            {ev.isOnline && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 flex items-center gap-1">
                <Video className="h-3 w-3" /> Online
              </span>
            )}
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ev.fee === 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-white"}`}>
              {fmtFee(ev.fee)}
            </span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-white group-hover:text-primary-200 transition-colors leading-tight max-w-2xl">
            {ev.title}
          </h2>
          <p className="text-slate-300 text-sm mt-2 line-clamp-2 max-w-xl">{ev.description}</p>

          <div className="flex flex-wrap gap-5 mt-5 text-sm text-slate-300">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 shrink-0" />{fmtDate(eDate)} · {fmtTime(eDate)}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" />{ev.location}</div>
            <div className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0" />{ev.rsvpCount} going</div>
          </div>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-3">
              {ev.rsvps.length > 0 && (
                <div className="flex -space-x-2">
                  {ev.rsvps.slice(0, 6).map(r => (
                    <Avatar key={r.userId} className="h-7 w-7 ring-2 ring-slate-900">
                      <AvatarImage src={r.avatarUrl ?? r.image ?? ""} />
                      <AvatarFallback className="text-[10px] bg-slate-700 text-white">{getInitials(r.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
              <span className="text-xs text-slate-400">
                Hosted by <span className="text-white font-medium">{ev.organizer.name?.split(" ")[0]}</span>
                {ev.organizer.company && <span className="text-slate-500"> · {ev.organizer.company.name}</span>}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 transition-colors px-4 py-2 rounded-xl">
              View details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Grid Card ─────────────────────────────────────────────────────────────────

function GridCard({ event: ev, bookmarks, onBookmark }: {
  event: EventItem
  bookmarks: Set<string>
  onBookmark: (id: string, e: React.MouseEvent) => void
}) {
  const cc    = CAT_COLORS[ev.category]
  const eDate = new Date(ev.date)
  const saved = bookmarks.has(ev.id)

  return (
    <Link href={`/events/${ev.id}`} className="group flex flex-col">
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 transition-all duration-200">

        {/* Image */}
        <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
          {ev.images[0] ? (
            <Image src={ev.images[0]} alt={ev.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${cc?.gradient ?? "from-slate-700 to-slate-800"} opacity-60 flex items-center justify-center`}>
              <span className="text-5xl">
                {ev.category === "TREK" ? "🥾" : ev.category === "SPORTS" ? "⚽" : ev.category === "NETWORKING" ? "🤝" : ev.category === "HOBBY" ? "🎨" : "🎉"}
              </span>
            </div>
          )}

          {/* Date badge */}
          <div className="absolute top-3 left-3 bg-white dark:bg-slate-900 rounded-xl shadow-md px-2.5 py-1.5 text-center min-w-[44px]">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">{fmtMon(eDate)}</p>
            <p className="text-xl font-black text-foreground leading-tight">{fmtDay(eDate)}</p>
          </div>

          {/* Bookmark */}
          <button
            onClick={e => onBookmark(ev.id, e)}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
          >
            {saved
              ? <BookmarkCheck className="h-3.5 w-3.5 text-amber-400" />
              : <Bookmark className="h-3.5 w-3.5 text-white" />
            }
          </button>

          {/* Fee badge */}
          <div className="absolute bottom-3 right-3">
            <span className={`text-xs font-semibold px-2 py-1 rounded-lg shadow ${ev.fee === 0 ? "bg-emerald-500 text-white" : "bg-slate-900/80 text-white backdrop-blur-sm"}`}>
              {fmtFee(ev.fee)}
            </span>
          </div>

          {/* Category pill */}
          {cc && (
            <div className="absolute bottom-3 left-3">
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />{ev.category}
              </span>
            </div>
          )}

          {/* Online badge */}
          {ev.isOnline && (
            <div className="absolute top-3 right-12">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/80 text-white flex items-center gap-1">
                <Globe className="h-2.5 w-2.5" />Online
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          <div>
            <h3 className="font-semibold text-sm leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
              {ev.title}
            </h3>
            {ev.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {ev.tags.slice(0, 2).map(t => (
                  <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md">{t}</span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />{fmtDate(eDate)} · {fmtTime(eDate)}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{ev.location}</span>
            </div>
            {ev.requiresApproval && (
              <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Filter className="h-3.5 w-3.5 shrink-0" />Requires approval
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 mt-auto border-t border-border">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-5 w-5 shrink-0">
                <AvatarImage src={ev.organizer.avatarUrl ?? ev.organizer.image ?? ""} />
                <AvatarFallback className="text-[9px]">{getInitials(ev.organizer.name)}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground truncate">{ev.organizer.name?.split(" ")[0]}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {ev.rsvps.slice(0, 3).length > 0 && (
                <div className="flex -space-x-1.5">
                  {ev.rsvps.slice(0, 3).map(r => (
                    <Avatar key={r.userId} className="h-5 w-5 ring-1 ring-card">
                      <AvatarImage src={r.avatarUrl ?? r.image ?? ""} />
                      <AvatarFallback className="text-[8px]">{getInitials(r.name)}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              )}
              <span className="text-xs text-muted-foreground font-medium">{ev.rsvpCount} going</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── List Card ─────────────────────────────────────────────────────────────────

function ListCard({ event: ev, bookmarks, onBookmark }: {
  event: EventItem
  bookmarks: Set<string>
  onBookmark: (id: string, e: React.MouseEvent) => void
}) {
  const cc    = CAT_COLORS[ev.category]
  const eDate = new Date(ev.date)
  const saved = bookmarks.has(ev.id)

  return (
    <Link href={`/events/${ev.id}`} className="group block">
      <div className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-px transition-all duration-200">
        <div className="flex gap-0">
          {/* Date column */}
          <div className={`w-16 shrink-0 flex flex-col items-center justify-center py-4 bg-gradient-to-b ${cc?.gradient ?? "from-slate-700 to-slate-900"} text-white`}>
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">{fmtMon(eDate)}</p>
            <p className="text-2xl font-black leading-none">{fmtDay(eDate)}</p>
          </div>

          {/* Image thumbnail */}
          {ev.images[0] && (
            <div className="relative w-24 sm:w-32 shrink-0 overflow-hidden">
              <Image src={ev.images[0]} alt={ev.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0 px-4 py-3 flex flex-col gap-1.5 justify-center">
            <div className="flex items-center gap-2 flex-wrap">
              {cc && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
                  {ev.category}
                </span>
              )}
              {ev.isOnline && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Online</span>}
              {ev.requiresApproval && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">Approval req.</span>}
            </div>
            <h3 className="font-semibold text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
              {ev.title}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(eDate)}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /><span className="truncate max-w-[140px]">{ev.location}</span></span>
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{ev.rsvpCount} going</span>
            </div>
          </div>

          {/* Right */}
          <div className="shrink-0 flex flex-col items-end justify-center gap-2 pr-4 py-3">
            <span className={`text-sm font-bold ${ev.fee === 0 ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
              {fmtFee(ev.fee)}
            </span>
            <button
              onClick={e => onBookmark(ev.id, e)}
              className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              {saved
                ? <BookmarkCheck className="h-3.5 w-3.5 text-amber-500" />
                : <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
              }
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
