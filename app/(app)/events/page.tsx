import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import { Plus, Calendar, MapPin, Users, Zap, ArrowRight, Clock, TrendingUp, Sparkles } from "lucide-react"
import { FREE_LIMITS } from "@/lib/limits"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency, getInitials } from "@/lib/utils"

export const dynamic = "force-dynamic"

const CATEGORIES = [
  { value: "All",        label: "All Events",  emoji: "✦"  },
  { value: "TREK",       label: "Treks",       emoji: "🥾" },
  { value: "SPORTS",     label: "Sports",      emoji: "⚽" },
  { value: "NETWORKING", label: "Networking",  emoji: "🤝" },
  { value: "HOBBY",      label: "Hobbies",     emoji: "🎨" },
  { value: "OTHER",      label: "More",        emoji: "🎉" },
]

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  TREK:       { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  SPORTS:     { bg: "bg-blue-100 dark:bg-blue-900/40",      text: "text-blue-700 dark:text-blue-300",       dot: "bg-blue-500"    },
  NETWORKING: { bg: "bg-violet-100 dark:bg-violet-900/40",  text: "text-violet-700 dark:text-violet-300",   dot: "bg-violet-500"  },
  HOBBY:      { bg: "bg-rose-100 dark:bg-rose-900/40",      text: "text-rose-700 dark:text-rose-300",       dot: "bg-rose-500"    },
  OTHER:      { bg: "bg-amber-100 dark:bg-amber-900/40",    text: "text-amber-700 dark:text-amber-300",     dot: "bg-amber-500"   },
}

function formatEventDate(date: Date) {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
}
function formatEventTime(date: Date) {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}
function formatMonth(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()
}
function formatDay(date: Date) {
  return date.getDate()
}

export default async function EventsPage({ searchParams }: { searchParams: { category?: string } }) {
  const session    = await auth()
  const isPremium  = session?.user?.membershipPlan === "PREMIUM"
  const activeCategory = searchParams.category ?? "All"

  const [myEventsCount, events, totalEvents, totalRsvps] = await Promise.all([
    session?.user?.id && !isPremium
      ? prisma.event.count({ where: { organizerId: session.user.id, isActive: true } })
      : Promise.resolve(0),
    prisma.event.findMany({
      where: {
        isActive: true,
        date: { gte: new Date() },
        ...(activeCategory !== "All" ? { category: activeCategory } : {}),
      },
      orderBy: [{ isBoosted: "desc" }, { date: "asc" }],
      take: 40,
      include: {
        organizer: { include: { company: { select: { name: true, logo: true, domain: true } } } },
        rsvps: { include: { user: { select: { id: true, name: true, image: true, avatarUrl: true } } }, take: 5 },
        _count: { select: { rsvps: true } },
      },
    }),
    prisma.event.count({ where: { isActive: true, date: { gte: new Date() } } }),
    prisma.eventRsvp.count(),
  ])

  const featured  = events.filter(e => e.isBoosted)
  const regular   = events.filter(e => !e.isBoosted)
  const spotlight = featured[0] ?? events[0]
  const gridEvents = spotlight
    ? events.filter(e => e.id !== spotlight.id)
    : []

  return (
    <div className="min-h-full bg-background">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-slate-400 border border-slate-700 rounded-full px-3 py-1">
                  <Sparkles className="h-3 w-3" /> Corporate Events
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Events &amp; Communities</h1>
              <p className="text-slate-400 mt-1.5 text-sm max-w-xl">
                Treks, sports leagues, networking nights and hobby clubs — exclusively for verified professionals.
              </p>
              {/* Stats row */}
              <div className="flex items-center gap-6 mt-5">
                <div>
                  <p className="text-2xl font-bold text-white">{totalEvents}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Upcoming events</p>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <p className="text-2xl font-bold text-white">{totalRsvps.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Total RSVPs</p>
                </div>
                <div className="w-px h-8 bg-slate-700" />
                <div>
                  <p className="text-2xl font-bold text-white">100%</p>
                  <p className="text-xs text-slate-400 mt-0.5">Verified members</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3 shrink-0">
              {!isPremium && session?.user?.id && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs">
                  <span className="text-amber-300 font-medium">{myEventsCount}/{FREE_LIMITS.events} events</span>
                  <Link href="/membership" className="flex items-center gap-1 text-amber-400 font-bold hover:underline">
                    <Zap className="h-3 w-3" />Upgrade
                  </Link>
                </div>
              )}
              <Button asChild className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-lg">
                <Link href="/events/new"><Plus className="h-4 w-4 mr-1.5" /> Create Event</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Category filter — overlaps into white area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.value
              return (
                <Link
                  key={cat.value}
                  href={`/events${cat.value !== "All" ? `?category=${cat.value}` : ""}`}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                    isActive
                      ? "bg-background text-foreground border-primary-600 shadow-sm"
                      : "text-slate-400 border-transparent hover:text-white hover:border-slate-600"
                  }`}
                >
                  <span>{cat.emoji}</span>
                  {cat.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-5 text-4xl">🎉</div>
            <h3 className="text-xl font-semibold mb-2">No upcoming events</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">Be the first to organise a trek, networking night or sports session for your network.</p>
            <Button asChild size="lg"><Link href="/events/new"><Plus className="h-4 w-4 mr-1.5" />Create the first event</Link></Button>
          </div>
        ) : (
          <div className="space-y-10">

            {/* ── Spotlight card ──────────────────────────────────────────── */}
            {spotlight && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary-600" />
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Featured</h2>
                  </div>
                </div>
                <Link href={`/events/${spotlight.id}`} className="group block">
                  <div className="relative rounded-2xl overflow-hidden bg-slate-900 min-h-[320px] lg:min-h-[380px] flex">
                    {/* Background image */}
                    {spotlight.images[0] ? (
                      <Image
                        src={spotlight.images[0]}
                        alt={spotlight.title}
                        fill
                        className="object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-violet-900 via-slate-800 to-slate-900" />
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col justify-end p-8 lg:p-10 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {(() => {
                          const cc = CATEGORY_COLORS[spotlight.category]
                          return cc ? (
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cc.bg} ${cc.text}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />
                              {spotlight.category}
                            </span>
                          ) : null
                        })()}
                        {spotlight.fee === 0 ? (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">Free</span>
                        ) : (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white">{formatCurrency(spotlight.fee)}</span>
                        )}
                      </div>

                      <h2 className="text-2xl lg:text-3xl font-bold text-white group-hover:text-primary-200 transition-colors leading-tight max-w-2xl">
                        {spotlight.title}
                      </h2>
                      <p className="text-slate-300 text-sm mt-2 line-clamp-2 max-w-xl">{spotlight.description}</p>

                      <div className="flex flex-wrap items-center gap-5 mt-5">
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <Calendar className="h-4 w-4 shrink-0" />
                          <span>{formatEventDate(new Date(spotlight.date))} · {formatEventTime(new Date(spotlight.date))}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span>{spotlight.location}</span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300 text-sm">
                          <Users className="h-4 w-4 shrink-0" />
                          <span>{spotlight._count.rsvps} going</span>
                        </div>
                      </div>

                      {/* Attendee avatars + CTA */}
                      <div className="flex items-center justify-between mt-6">
                        <div className="flex items-center gap-3">
                          {spotlight.rsvps.length > 0 && (
                            <div className="flex -space-x-2">
                              {spotlight.rsvps.slice(0, 5).map(r => (
                                <Avatar key={r.userId} className="h-7 w-7 ring-2 ring-slate-900">
                                  <AvatarImage src={r.user.avatarUrl ?? r.user.image ?? ""} />
                                  <AvatarFallback className="text-[10px] bg-slate-700 text-white">{getInitials(r.user.name)}</AvatarFallback>
                                </Avatar>
                              ))}
                            </div>
                          )}
                          <div className="text-xs text-slate-400">
                            <span className="text-white font-medium">{spotlight.organizer.name?.split(" ")[0]}</span> is hosting
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 transition-colors px-4 py-2 rounded-xl">
                          View details <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </section>
            )}

            {/* ── Events grid ─────────────────────────────────────────────── */}
            {gridEvents.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary-600" />
                    <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                      {activeCategory === "All" ? "All Upcoming" : `${activeCategory} Events`}
                    </h2>
                    <span className="text-xs text-muted-foreground font-normal">({gridEvents.length})</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {gridEvents.map((event) => {
                    const cc    = CATEGORY_COLORS[event.category]
                    const eDate = new Date(event.date)
                    const tags  = (() => { try { return JSON.parse((event as any).tags ?? "[]") } catch { return [] } })()

                    return (
                      <Link key={event.id} href={`/events/${event.id}`} className="group flex flex-col">
                        <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:-translate-y-0.5 transition-all duration-200">

                          {/* Image area */}
                          <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            {event.images[0] ? (
                              <Image
                                src={event.images[0]}
                                alt={event.title}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                                <span className="text-5xl opacity-60">
                                  {event.category === "TREK" ? "🥾" : event.category === "SPORTS" ? "⚽" : event.category === "NETWORKING" ? "🤝" : event.category === "HOBBY" ? "🎨" : "🎉"}
                                </span>
                              </div>
                            )}
                            {/* Date badge */}
                            <div className="absolute top-3 left-3 bg-white dark:bg-slate-900 rounded-xl shadow-md px-2.5 py-1.5 text-center min-w-[44px]">
                              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground leading-none">{formatMonth(eDate)}</p>
                              <p className="text-xl font-black text-foreground leading-tight">{formatDay(eDate)}</p>
                            </div>
                            {/* Fee badge */}
                            <div className="absolute top-3 right-3">
                              {event.fee === 0 ? (
                                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-500 text-white shadow">Free</span>
                              ) : (
                                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-slate-900/80 text-white shadow backdrop-blur-sm">{formatCurrency(event.fee)}</span>
                              )}
                            </div>
                            {/* Category pill */}
                            {cc && (
                              <div className="absolute bottom-3 left-3">
                                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cc.bg} ${cc.text}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />
                                  {event.category}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Body */}
                          <div className="flex flex-col flex-1 p-4 gap-3">
                            <div>
                              <h3 className="font-semibold text-sm leading-snug group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                                {event.title}
                              </h3>
                              {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {(tags as string[]).slice(0, 2).map((t: string) => (
                                    <span key={t} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded-md">{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                <span>{formatEventDate(eDate)} · {formatEventTime(eDate)}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{event.location}</span>
                              </div>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 mt-auto border-t border-border">
                              {/* Organizer + attendees */}
                              <div className="flex items-center gap-2 min-w-0">
                                <Avatar className="h-6 w-6 shrink-0">
                                  <AvatarImage src={event.organizer.avatarUrl ?? event.organizer.image ?? ""} />
                                  <AvatarFallback className="text-[9px]">{getInitials(event.organizer.name)}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs text-muted-foreground truncate">{event.organizer.name?.split(" ")[0]}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {event.rsvps.length > 0 && (
                                  <div className="flex -space-x-1.5">
                                    {event.rsvps.slice(0, 3).map(r => (
                                      <Avatar key={r.userId} className="h-5 w-5 ring-1 ring-card">
                                        <AvatarImage src={r.user.avatarUrl ?? r.user.image ?? ""} />
                                        <AvatarFallback className="text-[8px]">{getInitials(r.user.name)}</AvatarFallback>
                                      </Avatar>
                                    ))}
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground font-medium">{event._count.rsvps} going</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </section>
            )}

          </div>
        )}
      </div>
    </div>
  )
}
