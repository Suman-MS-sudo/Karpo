import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function PATCH(req: NextRequest, { params }: { params: { id: string; reqId: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { action } = await req.json()
  if (!["APPROVE", "DECLINE", "CANCEL"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  const route = await prisma.carpoolRoute.findUnique({
    where: { id: params.id },
    select: { userId: true, fromLocation: true, toLocation: true, departureTime: true, seatsAvailable: true },
  })
  if (!route) return NextResponse.json({ error: "Route not found" }, { status: 404 })

  const request = await prisma.carpoolRequest.findUnique({
    where: { id: params.reqId },
    select: { id: true, userId: true, routeId: true, status: true, pickupPoint: true, seatsNeeded: true, paymentMode: true },
  })
  if (!request || request.routeId !== params.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 })
  }

  // Riders cancel their own request; drivers approve/decline others' requests
  if (action === "CANCEL") {
    if (request.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (request.status === "CANCELLED") {
      return NextResponse.json({ error: "Already cancelled" }, { status: 400 })
    }
    await prisma.carpoolRequest.update({ where: { id: request.id }, data: { status: "CANCELLED" } })
    return NextResponse.json({ status: "CANCELLED" })
  }

  // APPROVE / DECLINE — driver only
  if (route.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: `Already ${request.status.toLowerCase()}` }, { status: 400 })
  }

  // On APPROVE: re-check seats haven't been filled by concurrent approvals
  if (action === "APPROVE") {
    const approvedAgg = await prisma.carpoolRequest.aggregate({
      where: { routeId: params.id, status: "APPROVED" },
      _sum:  { seatsNeeded: true },
    })
    const seatsLeft = route.seatsAvailable - (approvedAgg._sum.seatsNeeded ?? 0)
    if (request.seatsNeeded > seatsLeft) {
      return NextResponse.json({ error: `Only ${seatsLeft} seat${seatsLeft !== 1 ? "s" : ""} remaining — cannot approve` }, { status: 400 })
    }
  }

  await prisma.carpoolRequest.update({
    where: { id: request.id },
    data:  { status: action === "APPROVE" ? "APPROVED" : "DECLINED" },
  })

  if (action === "APPROVE") {
    const driver = await prisma.user.findUnique({
      where:  { id: session.user.id },
      select: { name: true, phone: true },
    })

    const paymentNote = request.paymentMode === "MONTHLY" ? "payment via monthly pass" : request.paymentMode === "UPI" ? "UPI payment" : "cash payment"

    const msg = [
      `Your seat request for the ${route.fromLocation} → ${route.toLocation} carpool has been approved! 🚗`,
      `Departure: ${route.departureTime}`,
      request.pickupPoint ? `Your pickup: ${request.pickupPoint}` : null,
      `Payment: ${paymentNote}`,
      driver?.phone ? `Driver contact: ${driver.phone}` : null,
      `See you on the road! — ${driver?.name ?? "Your driver"}`,
    ].filter(Boolean).join("\n")

    await prisma.message.create({
      data: { senderId: session.user.id, receiverId: request.userId, content: msg, listingType: "carpool", listingId: params.id },
    })
    await prisma.notification.create({
      data: { userId: request.userId, type: "GENERAL", title: "Seat approved! 🚗", body: `Your carpool request for ${route.fromLocation} → ${route.toLocation} has been approved.`, link: `/carpool/${params.id}` },
    })
  } else {
    await prisma.notification.create({
      data: { userId: request.userId, type: "GENERAL", title: "Seat request update", body: `Your seat request for ${route.fromLocation} → ${route.toLocation} was not approved this time.`, link: `/carpool/${params.id}` },
    })
  }

  return NextResponse.json({ status: action === "APPROVE" ? "APPROVED" : "DECLINED" })
}
