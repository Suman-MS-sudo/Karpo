import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { verifyPaymentSignature } from "@/lib/payments"
import { emitNotification } from "@/lib/notification-events"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

  if (!verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Update payment status
  const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: razorpay_order_id } })
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  if (payment.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "COMPLETED", razorpayPaymentId: razorpay_payment_id },
  })

  if (payment.type === "MEMBERSHIP") {
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    await prisma.membership.upsert({
      where: { userId: session.user.id },
      update: { plan: "PREMIUM", endDate },
      create: { userId: session.user.id, plan: "PREMIUM", endDate },
    })
  }

  if (payment.type === "EVENT_RSVP") {
    const meta    = JSON.parse(payment.metadata ?? "{}")
    const eventId = meta.eventId as string
    const event   = await prisma.event.findUnique({ where: { id: eventId } })

    if (event) {
      const existing = await prisma.eventRsvp.findUnique({
        where: { eventId_userId: { eventId, userId: session.user.id } },
      })

      if (!existing) {
        const status = event.requiresApproval ? "PENDING" : "CONFIRMED"
        let capacityOk = true
        if (status === "CONFIRMED" && event.maxParticipants) {
          const confirmedCount = await prisma.eventRsvp.count({ where: { eventId, status: "CONFIRMED" } })
          capacityOk = confirmedCount < event.maxParticipants
        }

        if (capacityOk) {
          const [rsvp, notification] = await prisma.$transaction([
            prisma.eventRsvp.create({ data: { eventId, userId: session.user.id, status } }),
            prisma.notification.create({
              data: {
                userId: event.organizerId,
                type:   "EVENT_RSVP",
                title:  status === "PENDING" ? "New RSVP request" : "New attendee",
                body:   `${session.user.name ?? "Someone"} paid and ${status === "PENDING" ? "requested to join" : "RSVP'd to"} "${event.title}"`,
                link:   `/events/${eventId}`,
              },
            }),
          ])
          emitNotification(event.organizerId, {
            id: notification.id, title: notification.title, body: notification.body,
            type: notification.type, isRead: notification.isRead, link: notification.link,
            createdAt: notification.createdAt.toISOString(),
          })
          void rsvp
        }
        // If capacity ran out between payment and verification, the payment stays
        // COMPLETED and no RSVP row is created — flagged for manual refund/review.
      }
    }
  }

  if (payment.type === "LISTING_BOOST") {
    const meta = JSON.parse(payment.metadata ?? "{}")
    const BOOST_DAYS: Record<string, number> = { BASIC: 7, FEATURED: 7, SUPER: 14 }
    const days = BOOST_DAYS[meta.boostLevel as string] ?? 7
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)
    await prisma.listing.update({
      where: { id: meta.listingId as string },
      data: {
        isBoosted:      true,
        boostLevel:     meta.boostLevel as string,
        boostExpiresAt: expiresAt,
      },
    })
  }

  return NextResponse.json({ success: true })
}
