import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { pickupPoint, pickupLat, pickupLng, dropoffPoint, dropoffLat, dropoffLng, seatsNeeded = 1, paymentMode, message } = await req.json()

  const route = await prisma.carpoolRoute.findUnique({
    where: { id: params.id },
    select: { userId: true, fromLocation: true, toLocation: true, isActive: true, seatsAvailable: true },
  })

  if (!route || !route.isActive) {
    return NextResponse.json({ error: "Route not found or inactive" }, { status: 404 })
  }
  if (route.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot request your own carpool" }, { status: 400 })
  }

  const existing = await prisma.carpoolRequest.findUnique({
    where: { routeId_userId: { routeId: params.id, userId: session.user.id } },
  })
  if (existing && existing.status !== "DECLINED" && existing.status !== "CANCELLED") {
    return NextResponse.json({ error: "Already requested this route", existing }, { status: 400 })
  }

  // Enforce seat availability
  const approvedAgg = await prisma.carpoolRequest.aggregate({
    where: { routeId: params.id, status: "APPROVED" },
    _sum:  { seatsNeeded: true },
  })
  const seatsLeft = route.seatsAvailable - (approvedAgg._sum.seatsNeeded ?? 0)
  if (Number(seatsNeeded) > seatsLeft) {
    return NextResponse.json({ error: `Only ${seatsLeft} seat${seatsLeft !== 1 ? "s" : ""} remaining` }, { status: 400 })
  }

  const reqData: any = {
    pickupPoint:  pickupPoint  || null,
    pickupLat:    pickupLat    ? Number(pickupLat)    : null,
    pickupLng:    pickupLng    ? Number(pickupLng)    : null,
    dropoffPoint: dropoffPoint || null,
    dropoffLat:   dropoffLat   ? Number(dropoffLat)   : null,
    dropoffLng:   dropoffLng   ? Number(dropoffLng)   : null,
    seatsNeeded:  Number(seatsNeeded),
    paymentMode:  paymentMode  || null,
    message:      message      || null,
  }

  const carpoolRequest = existing
    ? await prisma.carpoolRequest.update({ where: { id: existing.id }, data: { ...reqData, status: "PENDING" } })
    : await prisma.carpoolRequest.create({ data: { routeId: params.id, userId: session.user.id, ...reqData } })

  await prisma.notification.create({
    data: {
      userId: route.userId,
      type:   "GENERAL",
      title:  "New seat request 🚗",
      body:   `Someone requested ${seatsNeeded} seat(s) on your ${route.fromLocation} → ${route.toLocation} route.`,
      link:   `/carpool/${params.id}`,
    },
  })

  return NextResponse.json({ carpoolRequest })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const route = await prisma.carpoolRoute.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })
  if (!route || route.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const requests = await prisma.carpoolRequest.findMany({
    where:   { routeId: params.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, phone: true,
          avatarUrl: true, image: true, isVerified: true,
          jobTitle: true, department: true,
          company: { select: { name: true } },
        },
      },
    },
  })

  return NextResponse.json({ requests })
}
