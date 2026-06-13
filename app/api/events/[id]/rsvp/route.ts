import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { _count: { select: { rsvps: true } } },
  })
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })
  if (event.maxParticipants && event._count.rsvps >= event.maxParticipants) {
    return NextResponse.json({ error: "Event is full" }, { status: 400 })
  }

  const rsvp = await prisma.eventRsvp.upsert({
    where: { eventId_userId: { eventId: params.id, userId: session.user.id } },
    create: { eventId: params.id, userId: session.user.id },
    update: {},
  })
  return NextResponse.json(rsvp)
}
