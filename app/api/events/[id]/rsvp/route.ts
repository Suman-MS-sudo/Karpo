import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"
import { emitNotification } from "@/lib/notification-events"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event || !event.isActive) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  const existing = await prisma.eventRsvp.findUnique({
    where: { eventId_userId: { eventId: params.id, userId: session.user.id } },
  })
  if (existing) return NextResponse.json(existing)

  const status = event.requiresApproval ? "PENDING" : "CONFIRMED"
  if (status === "CONFIRMED" && event.maxParticipants) {
    const confirmedCount = await prisma.eventRsvp.count({
      where: { eventId: params.id, status: "CONFIRMED" },
    })
    if (confirmedCount >= event.maxParticipants) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }
  }

  try {
    const [rsvp, notification] = await prisma.$transaction([
      prisma.eventRsvp.create({
        data: { eventId: params.id, userId: session.user.id, status },
      }),
      prisma.notification.create({
        data: {
          userId: event.organizerId,
          type:   "EVENT_RSVP",
          title:  status === "PENDING" ? "New RSVP request" : "New attendee",
          body:   `${session.user.name ?? "Someone"} ${status === "PENDING" ? "requested to join" : "RSVP'd to"} "${event.title}"`,
          link:   `/events/${params.id}`,
        },
      }),
    ])
    emitNotification(event.organizerId, {
      id:        notification.id,
      title:     notification.title,
      body:      notification.body,
      type:      notification.type,
      isRead:    notification.isRead,
      link:      notification.link,
      createdAt: notification.createdAt.toISOString(),
    })
    revalidatePath(`/events/${params.id}`)
    return NextResponse.json(rsvp, { status: 201 })
  } catch {
    // Unique constraint hit — a concurrent request already created the RSVP.
    const rsvp = await prisma.eventRsvp.findUnique({
      where: { eventId_userId: { eventId: params.id, userId: session.user.id } },
    })
    return NextResponse.json(rsvp)
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  await prisma.eventRsvp.deleteMany({
    where: { eventId: params.id, userId: session.user.id },
  })
  revalidatePath(`/events/${params.id}`)
  return NextResponse.json({ ok: true })
}
