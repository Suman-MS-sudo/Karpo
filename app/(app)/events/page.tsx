import { Suspense } from "react"
import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { EventsClient } from "./EventsClient"
import type { EventItem } from "./EventsClient"
import { getWishlistedIds } from "@/lib/wishlist"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Events",
  description: "Discover treks, meetups, workshops, and networking events organized by members with verified corporate emails near you.",
}

// Temporarily disabled — matching BOOST_ENABLED in marketplace/page.tsx.
// Boosted events no longer get the "shown first" sort/spotlight treatment
// while this is off; re-enable by flipping this back to true.
const BOOST_ENABLED = false

export default async function EventsPage() {
  const session   = await auth()
  const userId    = session?.user?.id

  const [events, totalEvents, totalRsvps] = await Promise.all([
    prisma.event.findMany({
      where:   { isActive: true, date: { gte: new Date() } },
      orderBy: [...(BOOST_ENABLED ? [{ isBoosted: "desc" as const }] : []), { date: "asc" as const }],
      take:    100,
      include: {
        organizer: { include: { company: { select: { name: true } } } },
        rsvps:     { where: { status: "CONFIRMED" }, include: { user: { select: { id: true, name: true, image: true, avatarUrl: true } } }, take: 8 },
        _count:    { select: { rsvps: { where: { status: "CONFIRMED" } } } },
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
      isBoosted:        BOOST_ENABLED && ev.isBoosted,
      format:           ((ev as any).format as "IN_PERSON" | "ONLINE" | "HYBRID") ?? "IN_PERSON",
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

  const wishlistedIds = await getWishlistedIds(userId, "EVENT")

  return (
    <Suspense>
      <EventsClient
        events={serialized}
        totalEvents={totalEvents}
        totalRsvps={totalRsvps}
        initialCity={session?.user?.city ?? undefined}
        wishlistedIds={[...wishlistedIds]}
      />
    </Suspense>
  )
}
