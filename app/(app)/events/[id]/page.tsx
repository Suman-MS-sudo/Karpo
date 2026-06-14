import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, MapPin, Users, Globe, Video, Clock, Tag, Pencil, CheckCircle } from "lucide-react"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatDateTime, formatCurrency, getInitials } from "@/lib/utils"

type AgendaItem = { time: string; title: string; speaker?: string }

export default async function EventDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      organizer: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      rsvps: { include: { user: { select: { id: true, name: true, image: true, avatarUrl: true } } }, take: 20 },
      _count: { select: { rsvps: true } },
    },
  })

  if (!event || !event.isActive) notFound()
  const isOwner   = session?.user?.id === event.organizerId
  const hasRsvped = event.rsvps.some((r) => r.userId === session?.user?.id)
  const isFull    = event.maxParticipants ? event._count.rsvps >= event.maxParticipants : false
  const agenda    = event.agenda as AgendaItem[] | null
  const tags      = (event as any).tags as string[] ?? []
  const onlineLink = (event as any).onlineLink as string | null
  const requiresApproval = (event as any).requiresApproval as boolean ?? false

  const EMOJI: Record<string, string> = { TREK: "🥾", SPORTS: "⚽", NETWORKING: "🤝", HOBBY: "🎨", OTHER: "🎉" }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {event.images[0] ? (
            <div className="relative aspect-video rounded-2xl overflow-hidden">
              <Image src={event.images[0]} alt={event.title} fill className="object-cover" />
            </div>
          ) : (
            <div className="aspect-video rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-950/20 dark:to-orange-950/20 flex items-center justify-center">
              <span className="text-6xl">{EMOJI[event.category] ?? "🎉"}</span>
            </div>
          )}

          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  <Badge variant="secondary">{event.category}</Badge>
                  {onlineLink && <Badge variant="outline" className="flex items-center gap-1"><Video className="h-3 w-3" />Online</Badge>}
                  {requiresApproval && <Badge variant="outline">Approval required</Badge>}
                </div>
                <h1 className="text-2xl font-bold">{event.title}</h1>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((t) => <span key={t} className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-md">{t}</span>)}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <p className="text-xl font-bold text-primary-600">{event.fee === 0 ? "Free" : formatCurrency(event.fee)}</p>
                <div className="flex items-center gap-1.5">
                  {isOwner && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/events/${params.id}/edit`}><Pencil className="h-3.5 w-3.5 mr-1" />Edit</Link>
                    </Button>
                  )}
                  <SocialShare
                    title={`${event.title} — Event on Korpo`}
                    description={event.description ?? undefined}
                    path={`/events/${params.id}`}
                    variant="icon"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" /> <span>{formatDateTime(event.date)}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 shrink-0" /> <span>{event.location}</span>
              </div>
              {onlineLink && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 shrink-0 text-blue-500" />
                  {hasRsvped || isOwner ? (
                    <a href={onlineLink} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline text-sm">
                      Join online meeting
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-sm">Online link shared after RSVP</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4 shrink-0" />
                <span>{event._count.rsvps} going{event.maxParticipants ? ` · ${event.maxParticipants - event._count.rsvps} spots left` : ""}</span>
              </div>
            </div>

            {/* Capacity bar */}
            {event.maxParticipants && (
              <div className="mt-3">
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${isFull ? "bg-red-500" : event._count.rsvps / event.maxParticipants > 0.8 ? "bg-amber-500" : "bg-primary-600"}`}
                    style={{ width: `${Math.min(100, (event._count.rsvps / event.maxParticipants) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isFull ? "Event full" : `${event.maxParticipants - event._count.rsvps} of ${event.maxParticipants} spots available`}
                </p>
              </div>
            )}

            <div className="mt-6">
              <h2 className="font-semibold mb-2">About this event</h2>
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>

            {/* Agenda */}
            {agenda && agenda.length > 0 && (
              <div className="mt-6" id="agenda">
                <h2 className="font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Agenda</h2>
                <div className="space-y-2">
                  {agenda.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
                      {item.time && <span className="text-sm font-mono text-muted-foreground shrink-0 w-20">{item.time}</span>}
                      <div>
                        <p className="text-sm font-medium">{item.title}</p>
                        {item.speaker && <p className="text-xs text-muted-foreground">by {item.speaker}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendees */}
            {event.rsvps.length > 0 && (
              <div className="mt-6" id="attendees">
                <h2 className="font-semibold mb-3">Who&apos;s going ({event._count.rsvps})</h2>
                <div className="flex flex-wrap gap-2">
                  {event.rsvps.map((rsvp) => (
                    <Link key={rsvp.userId} href={`/profile/${rsvp.userId}`}>
                      <Avatar className="h-9 w-9 hover:ring-2 hover:ring-accent-400 transition-all">
                        <AvatarImage src={rsvp.user.avatarUrl ?? rsvp.user.image ?? ""} />
                        <AvatarFallback>{getInitials(rsvp.user.name)}</AvatarFallback>
                      </Avatar>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-semibold mb-4">Organiser</h3>
            <UserCard user={event.organizer} size="md" />
            <div className="mt-4 space-y-2">
              {isOwner ? (
                <>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/events/${params.id}/edit`}><Pencil className="h-4 w-4 mr-1.5" />Edit Event</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">{event._count.rsvps} attendee{event._count.rsvps !== 1 ? "s" : ""} confirmed</p>
                </>
              ) : hasRsvped ? (
                <Button variant="secondary" className="w-full">
                  <CheckCircle className="h-4 w-4 mr-1.5" />You&apos;re going!
                </Button>
              ) : isFull ? (
                <Button disabled className="w-full">Event Full</Button>
              ) : (
                <form action={`/api/events/${event.id}/rsvp`} method="POST">
                  <Button type="submit" className="w-full">
                    RSVP — {event.fee === 0 ? "Free" : formatCurrency(event.fee)}
                    {requiresApproval && <span className="text-xs opacity-70 ml-1">(approval req.)</span>}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Quick info */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />{formatDateTime(event.date)}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />{event.location}
            </div>
            {event.fee > 0 && (
              <div className="flex items-center gap-2 font-semibold">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0" />{formatCurrency(event.fee)} entry
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
