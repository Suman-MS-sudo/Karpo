import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function PATCH(req: Request, { params }: { params: { id: string; userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })
  if (event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const action = body.action as "approve" | "decline"

  const rsvp = await prisma.eventRsvp.findUnique({
    where: { eventId_userId: { eventId: params.id, userId: params.userId } },
  })
  if (!rsvp) return NextResponse.json({ error: "RSVP not found" }, { status: 404 })

  if (action === "decline") {
    await prisma.eventRsvp.delete({ where: { id: rsvp.id } })
    revalidatePath(`/events/${params.id}`)
    return NextResponse.json({ ok: true })
  }

  if (action === "approve") {
    if (event.maxParticipants) {
      const confirmedCount = await prisma.eventRsvp.count({
        where: { eventId: params.id, status: "CONFIRMED" },
      })
      if (confirmedCount >= event.maxParticipants) {
        return NextResponse.json({ error: "Event is already at capacity" }, { status: 400 })
      }
    }
    const updated = await prisma.eventRsvp.update({
      where: { id: rsvp.id },
      data:  { status: "CONFIRMED" },
    })
    revalidatePath(`/events/${params.id}`)
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
