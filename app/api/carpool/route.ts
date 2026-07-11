import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET() {
  const { error } = await requireVerified()
  if (error) return error

  const routes = await prisma.carpoolRoute.findMany({
    where:   { isActive: true },
    orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
    take:    40,
    include: {
      user:   { include: { company: { select: { name: true, logo: true, domain: true } } } },
      _count: { select: { requests: true } },
    },
  })
  return NextResponse.json({ data: routes })
}

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error

  const body = await req.json()

  const isPremium = session.user.membershipPlan === "PREMIUM"
  const route = await prisma.carpoolRoute.create({
    data: {
      userId:              session.user.id,
      fromLocation:        body.fromLocation,
      fromLat:             body.fromLat  ? Number(body.fromLat)  : null,
      fromLng:             body.fromLng  ? Number(body.fromLng)  : null,
      toLocation:          body.toLocation,
      toLat:               body.toLat    ? Number(body.toLat)    : null,
      toLng:               body.toLng    ? Number(body.toLng)    : null,
      stopCoords:          Array.isArray(body.stopCoords) ? body.stopCoords : [],
      departureTime:       body.departureTime,
      returnTrip:          Boolean(body.returnTrip),
      returnTime:          body.returnTime          || null,
      seatsAvailable:      Number(body.seatsAvailable),
      pricePerSeat:        Number(body.pricePerSeat),
      monthlyPassAvailable: Boolean(body.monthlyPassAvailable),
      monthlyPassPrice:    body.monthlyPassPrice    ? Number(body.monthlyPassPrice) : null,
      frequency:           body.frequency,
      vehicleType:         body.vehicleType,
      vehicleNumber:       body.vehicleNumber       || null,
      acAvailable:         body.acAvailable !== false,
      pickupPoints:        Array.isArray(body.pickupPoints) ? body.pickupPoints.filter(Boolean) : [],
      landmarks:           body.landmarks           || null,
      allowedGender:       body.allowedGender       || null,
      musicPolicy:         body.musicPolicy         || null,
      luggagePolicy:       body.luggagePolicy       || null,
      notes:               body.notes               || null,
      vehicleModel:        body.vehicleModel        || null,
      vehicleColor:        body.vehicleColor        || null,
      vehiclePhoto:        body.vehiclePhoto        || null,
      isBoosted:           isPremium,
    },
  })

  revalidatePath("/dashboard")
  return NextResponse.json(route, { status: 201 })
}
