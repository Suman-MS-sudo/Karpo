import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const route = await prisma.carpoolRoute.findUnique({
    where:  { id: params.id },
    select: { userId: true },
  })
  if (!route)                          return NextResponse.json({ error: "Not found" },  { status: 404 })
  if (route.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()

  if (body.action === "START_RIDE") {
    const updated = await prisma.carpoolRoute.update({
      where:  { id: params.id },
      data:   { rideStatus: "ACTIVE" },
      select: { rideStatus: true },
    })
    return NextResponse.json(updated)
  }

  if (body.action === "STOP_RIDE") {
    const updated = await prisma.carpoolRoute.update({
      where:  { id: params.id },
      data:   { rideStatus: "IDLE", liveTrackLat: null, liveTrackLng: null, liveTrackAt: null },
      select: { rideStatus: true },
    })
    return NextResponse.json(updated)
  }

  if (typeof body.lat === "number" && typeof body.lng === "number") {
    await prisma.carpoolRoute.update({
      where: { id: params.id },
      data:  { liveTrackLat: body.lat, liveTrackLng: body.lng, liveTrackAt: new Date() },
    })
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 })
}
