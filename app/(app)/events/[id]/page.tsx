import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, Calendar, MapPin, Users, Globe, Video, Clock,
  Pencil, ExternalLink, ChevronRight, PackageX,
} from "lucide-react"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatCurrency, getInitials } from "@/lib/utils"
import { RsvpButton } from "@/components/events/RsvpButton"
import { PendingRequestsPanel } from "@/components/events/PendingRequestsPanel"

type AgendaItem = { time: string; title: string; speaker?: string }

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string; light: string }> = {
  TREK:       { bg: "bg-emerald-100 dark:bg-emerald-900/40", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500",  light: "from-emerald-600 to-teal-700"    },
  SPORTS:     { bg: "bg-blue-100 dark:bg-blue-900/40",      text: "text-blue-700 dark:text-blue-300",       dot: "bg-blue-500",     light: "from-blue-600 to-indigo-700"     },
  NETWORKING: { bg: "bg-violet-100 dark:bg-violet-900/40",  text: "text-violet-700 dark:text-violet-300",   dot: "bg-violet-500",   light: "from-violet-600 to-purple-700"   },
  HOBBY:      { bg: "bg-rose-100 dark:bg-rose-900/40",      text: "text-rose-700 dark:text-rose-300",       dot: "bg-rose-500",     light: "from-rose-500 to-pink-700"       },
  OTHER:      { bg: "bg-amber-100 dark:bg-amber-900/40",    text: "text-amber-700 dark:text-amber-300",     dot: "bg-amber-500",    light: "from-amber-500 to-orange-600"    },
}

function formatEventDate(date: Date) {
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}
function formatEventTime(date: Date) {
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const event   = await prisma.event.findUnique({
    where:   { id: params.id },
    include: {
      organizer: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      rsvps:     { include: { user: { select: { id: true, name: true, image: true, avatarUrl: true } } }, take: 50 },
    },
  })

  if (!event) notFound()

  if (!event.isActive) {
    return (
      <div className="min-h-full bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-md mx-auto text-center bg-card border border-border rounded-2xl p-10">
            <PackageX className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-lg font-semibold mb-1.5">This event is no longer available</h1>
            <p className="text-sm text-muted-foreground mb-6">
              It may have been cancelled or has ended since you were notified.
            </p>
            <Button asChild>
              <Link href="/events">Back to Events</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const isOwner          = session?.user?.id === event.organizerId
  const confirmedRsvps    = event.rsvps.filter((r) => (r as any).status !== "PENDING")
  const pendingRsvps      = event.rsvps.filter((r) => (r as any).status === "PENDING")
  const confirmedCount    = confirmedRsvps.length
  const myRsvp            = event.rsvps.find((r) => r.userId === session?.user?.id)
  const myRsvpStatus: "NONE" | "PENDING" | "CONFIRMED" =
    !myRsvp ? "NONE" : (myRsvp as any).status === "PENDING" ? "PENDING" : "CONFIRMED"
  const isFull         = event.maxParticipants ? confirmedCount >= event.maxParticipants : false
  const agenda         = event.agenda as AgendaItem[] | null
  const tags           = (() => { try { return JSON.parse((event as any).tags ?? "[]") } catch { return [] } })() as string[]
  const onlineLink     = (event as any).onlineLink as string | null
  const requiresApproval = (event as any).requiresApproval as boolean ?? false
  const eDate          = new Date(event.date)
  const cc             = CATEGORY_COLORS[event.category]
  const gradient       = cc?.light ?? "from-slate-700 to-slate-900"
  const spotsLeft      = event.maxParticipants ? event.maxParticipants - confirmedCount : null
  const fillPct        = event.maxParticipants ? Math.min(100, (confirmedCount / event.maxParticipants) * 100) : 0

  return (
    <div className="min-h-full bg-background">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative bg-slate-900 overflow-hidden">
        {event.images[0] ? (
          <Image src={event.images[0]} alt={event.title} fill className="object-cover opacity-30" />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-950/30 via-transparent to-cyan-950/30 pointer-events-none" />
        <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
          {/* Breadcrumb */}
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-8 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Events
          </Link>

          <div className="flex flex-wrap items-center gap-2 mb-4">
            {cc && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cc.bg} ${cc.text}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${cc.dot}`} />
                {event.category}
              </span>
            )}
            {(event as any).format === "ONLINE" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300">
                <Video className="h-3 w-3" /> Online
              </span>
            )}
            {(event as any).format === "HYBRID" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300">
                <Globe className="h-3 w-3" /> Hybrid
              </span>
            )}
            {requiresApproval && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300">
                Approval required
              </span>
            )}
          </div>

          <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight max-w-3xl drop-shadow-lg">{event.title}</h1>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 bg-white/10 text-slate-300 rounded-full">{t}</span>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{formatEventDate(eDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{formatEventTime(eDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{confirmedCount} going{event.maxParticipants ? ` · ${spotsLeft} spots left` : ""}</span>
            </div>
          </div>

          {/* Attendee stack */}
          {confirmedRsvps.length > 0 && (
            <div className="flex items-center gap-3 mt-5">
              <div className="flex -space-x-2">
                {confirmedRsvps.slice(0, 8).map((r) => (
                  <Avatar key={r.userId} className="h-8 w-8 ring-2 ring-slate-900">
                    <AvatarImage src={r.user.avatarUrl ?? r.user.image ?? ""} />
                    <AvatarFallback className="text-[10px] bg-slate-700 text-white">{getInitials(r.user.name)}</AvatarFallback>
                  </Avatar>
                ))}
                {confirmedCount > 8 && (
                  <div className="h-8 w-8 rounded-full ring-2 ring-slate-900 bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-semibold">
                    +{confirmedCount - 8}
                  </div>
                )}
              </div>
              <span className="text-sm text-slate-400">{confirmedCount} people going</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left — main content */}
          <div className="lg:col-span-2 space-y-8">

            {/* About */}
            <section className="bg-card border-2 border-border rounded-3xl p-6 hover:border-fuchsia-300/50 dark:hover:border-fuchsia-800/50 transition-colors">
              <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" /> About this event
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-sm">{event.description}</p>
            </section>

            {/* Capacity */}
            {event.maxParticipants && (
              <section className="bg-card border-2 border-border rounded-3xl p-6 hover:border-fuchsia-300/50 dark:hover:border-fuchsia-800/50 transition-colors">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" /> Capacity
                </h2>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{confirmedCount} confirmed</span>
                  <span className="font-semibold">{event.maxParticipants} max</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${isFull ? "bg-gradient-to-r from-red-500 to-rose-500" : fillPct > 80 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-emerald-400 to-teal-400"}`}
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {isFull ? "This event is full" : `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} remaining`}
                </p>
              </section>
            )}

            {/* Agenda */}
            {agenda && agenda.length > 0 && (
              <section className="bg-card border-2 border-border rounded-3xl p-6 hover:border-fuchsia-300/50 dark:hover:border-fuchsia-800/50 transition-colors">
                <h2 className="text-base font-semibold mb-5 flex items-center gap-2">
                  <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" /> Agenda
                </h2>
                <div className="relative">
                  <div className="absolute left-[52px] top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-0">
                    {agenda.map((item, i) => (
                      <div key={i} className="flex gap-4 pb-5 last:pb-0">
                        <span className="text-xs font-mono text-muted-foreground w-12 shrink-0 pt-1 text-right">{item.time}</span>
                        <div className="relative pl-5">
                          <div className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400 ring-4 ring-background" />
                          <p className="text-sm font-medium">{item.title}</p>
                          {item.speaker && <p className="text-xs text-muted-foreground mt-0.5">by {item.speaker}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Online link */}
            {onlineLink && (myRsvpStatus === "CONFIRMED" || isOwner) && (
              <section className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Online Meeting Link
                </h2>
                <a
                  href={onlineLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {onlineLink} <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </section>
            )}
            {onlineLink && myRsvpStatus !== "CONFIRMED" && !isOwner && (
              <section className="bg-muted/50 border border-border rounded-2xl p-5 flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {myRsvpStatus === "PENDING"
                    ? "Online meeting link will be shared once your RSVP is approved."
                    : "Online meeting link will be shared after you RSVP."}
                </p>
              </section>
            )}

            {/* Pending requests — organizer only */}
            {isOwner && <PendingRequestsPanel eventId={event.id} requests={pendingRsvps.map((r) => ({ userId: r.userId, name: r.user.name, image: r.user.image, avatarUrl: r.user.avatarUrl }))} />}

            {/* Attendees */}
            {confirmedRsvps.length > 0 && (
              <section id="attendees" className="bg-card border-2 border-border rounded-3xl p-6 hover:border-fuchsia-300/50 dark:hover:border-fuchsia-800/50 transition-colors scroll-mt-24">
                <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                  <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" /> Who&apos;s going
                  <span className="text-muted-foreground font-normal text-sm">({confirmedCount})</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {confirmedRsvps.map((rsvp) => (
                    <Link
                      key={rsvp.userId}
                      href={`/profile/${rsvp.userId}`}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors group"
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={rsvp.user.avatarUrl ?? rsvp.user.image ?? ""} />
                        <AvatarFallback className="text-[10px]">{getInitials(rsvp.user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate group-hover:text-primary-600 transition-colors">
                        {rsvp.user.name?.split(" ")[0]}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right — sidebar */}
          <div className="space-y-4">

            {/* RSVP card */}
            <div className="bg-card border-2 border-fuchsia-200 dark:border-fuchsia-900/60 rounded-3xl p-5 sticky top-6 shadow-[0_8px_30px_rgba(217,70,239,0.08)]">
              {/* Price */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-black bg-gradient-to-r from-fuchsia-600 to-cyan-500 dark:from-fuchsia-400 dark:to-cyan-300 bg-clip-text text-transparent">
                    {event.fee === 0 ? "Free" : formatCurrency(event.fee)}
                  </p>
                  {event.fee > 0 && <p className="text-xs text-muted-foreground">per person</p>}
                </div>
                <SocialShare
                  title={`${event.title} — Event on Korpo`}
                  description={event.description ?? undefined}
                  path={`/events/${params.id}`}
                  variant="icon"
                />
              </div>

              {/* RSVP action */}
              {isOwner ? (
                <div className="space-y-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/events/${params.id}/edit`}><Pencil className="h-4 w-4 mr-1.5" /> Edit Event</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">{confirmedCount} attendee{confirmedCount !== 1 ? "s" : ""} confirmed</p>
                </div>
              ) : (
                <RsvpButton
                  eventId={event.id}
                  eventTitle={event.title}
                  initialStatus={myRsvpStatus}
                  isFull={isFull}
                  fee={event.fee}
                  requiresApproval={requiresApproval}
                />
              )}

              {/* Capacity mini bar */}
              {event.maxParticipants && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>{confirmedCount} going</span>
                    <span>{event.maxParticipants} max</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isFull ? "bg-gradient-to-r from-red-500 to-rose-500" : fillPct > 80 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-emerald-400 to-teal-400"}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  {!isFull && <p className="text-xs text-muted-foreground mt-1">{spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left</p>}
                </div>
              )}

              <p className="text-[11px] text-muted-foreground/80 leading-relaxed mt-4 pt-4 border-t border-border">
                This event is organized independently by {event.organizer.name?.split(" ")[0] ?? "the host"}. Korpo only
                provides the platform to list and discover it, and isn&apos;t responsible for how it&apos;s run.
              </p>
            </div>

            {/* Event details card */}
            <div className="bg-card border-2 border-border rounded-3xl p-5 space-y-3.5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Event Details</h3>
              <div className="flex items-start gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{formatEventDate(eDate)}</p>
                  <p className="text-muted-foreground text-xs">{formatEventTime(eDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="font-medium">{event.location}</p>
              </div>
              {event.fee > 0 && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="h-4 w-4 shrink-0 text-muted-foreground flex items-center justify-center text-base">₹</span>
                  <p className="font-medium">{formatCurrency(event.fee)} entry</p>
                </div>
              )}
            </div>

            {/* Organiser card */}
            <div className="bg-card border-2 border-border rounded-3xl p-5">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Organised by</h3>
              <Link href={`/profile/${event.organizer.id}`} className="flex items-center gap-3 group">
                <Avatar className="h-10 w-10 shrink-0 ring-2 ring-fuchsia-300 dark:ring-fuchsia-800">
                  <AvatarImage src={event.organizer.avatarUrl ?? event.organizer.image ?? ""} />
                  <AvatarFallback>{getInitials(event.organizer.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold group-hover:text-fuchsia-600 transition-colors truncate">{event.organizer.name}</p>
                  {event.organizer.company && (
                    <p className="text-xs text-muted-foreground truncate">{event.organizer.company.name}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
