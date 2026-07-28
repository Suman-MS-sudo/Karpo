import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"
import { createOrder } from "@/lib/payments"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const event = await prisma.event.findUnique({ where: { id: params.id } })
  if (!event || !event.isActive) return NextResponse.json({ error: "Event not found" }, { status: 404 })
  if (event.fee <= 0) return NextResponse.json({ error: "This event is free" }, { status: 400 })

  const existing = await prisma.eventRsvp.findUnique({
    where: { eventId_userId: { eventId: params.id, userId: session.user.id } },
  })
  if (existing) return NextResponse.json({ error: "You've already RSVP'd to this event" }, { status: 400 })

  if (event.maxParticipants && !event.requiresApproval) {
    const confirmedCount = await prisma.eventRsvp.count({
      where: { eventId: params.id, status: "CONFIRMED" },
    })
    if (confirmedCount >= event.maxParticipants) {
      return NextResponse.json({ error: "Event is full" }, { status: 400 })
    }
  }

  const amount  = event.fee * 100 // paise
  const receipt = `event_${params.id}_${Date.now()}`
  const order   = await createOrder(amount, receipt, {
    userId:  session.user.id,
    type:    "EVENT_RSVP",
    eventId: params.id,
  })

  await prisma.payment.create({
    data: {
      userId:          session.user.id,
      amount,
      type:            "EVENT_RSVP",
      status:          "PENDING",
      razorpayOrderId: order.id as string,
      metadata:        JSON.stringify({ eventId: params.id }),
    },
  })

  return NextResponse.json({ orderId: order.id, amount })
}
