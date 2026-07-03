import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { FREE_LIMITS } from "@/lib/limits"
import { EventsClient } from "./EventsClient"
import type { EventItem } from "./EventsClient"

export const dynamic = "force-dynamic"

export default async function EventsPage() {
  const session   = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"
  const userId    = session?.user?.id

  const [myEventsCount, events, totalEvents, totalRsvps] = await Promise.all([
    userId && !isPremium
      ? prisma.event.count({ where: { organizerId: userId, isActive: true } })
      : Promise.resolve(0),
    prisma.event.findMany({
      where:   { isActive: true, date: { gte: new Date() } },
      orderBy: [{ isBoosted: "desc" }, { date: "asc" }],
      take:    100,
      include: {
        organizer: { include: { company: { select: { name: true } } } },
        rsvps:     { include: { user: { select: { id: true, name: true, image: true, avatarUrl: true } } }, take: 8 },
        _count:    { select: { rsvps: true } },
      },
    }),
    prisma.event.count({ where: { isActive: true, date: { gte: new Date() } } }),
    prisma.eventRsvp.count(),
  ])

  const serialized: EventItem[] = events.map(ev => {
    let tags: string[] = []
    try { tags = JSON.parse((ev as any).tags ?? "[]") } catch {}
    let images: string[] = []
    try { images = JSON.parse(typeof ev.images === "string" ? ev.images : JSON.stringify(ev.images)) } catch {}

    return {
      id:               ev.id,
      title:            ev.title,
      description:      ev.description,
      category:         ev.category,
      date:             ev.date.toISOString(),
      location:         ev.location,
      fee:              ev.fee,
      maxParticipants:  ev.maxParticipants ?? null,
      images,
      tags,
      isBoosted:        ev.isBoosted,
      isOnline:         !!((ev as any).onlineLink),
      requiresApproval: !!((ev as any).requiresApproval),
      rsvpCount:        ev._count.rsvps,
      hasRsvped:        userId ? ev.rsvps.some(r => r.userId === userId) : false,
      rsvps: ev.rsvps.map(r => ({
        userId:    r.userId,
        name:      r.user.name,
        image:     r.user.image,
        avatarUrl: r.user.avatarUrl,
      })),
      organizer: {
        id:        ev.organizer.id,
        name:      ev.organizer.name,
        image:     ev.organizer.image,
        avatarUrl: ev.organizer.avatarUrl,
        company:   ev.organizer.company ? { name: ev.organizer.company.name } : null,
      },
    }
  })

  return (
    <EventsClient
      events={serialized}
      totalEvents={totalEvents}
      totalRsvps={totalRsvps}
      isPremium={isPremium}
      myEventsCount={myEventsCount}
      eventsLimit={FREE_LIMITS.events}
    />
  )
}
