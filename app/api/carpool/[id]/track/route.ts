import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const route = await prisma.carpoolRoute.findUnique({
    where:  { id: params.id },
    select: { userId: true, rideStatus: true, liveTrackLat: true, liveTrackLng: true, liveTrackAt: true },
  })
  if (!route) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const isOwner = route.userId === session.user.id
  if (!isOwner) {
    const req = await prisma.carpoolRequest.findUnique({
      where:  { routeId_userId: { routeId: params.id, userId: session.user.id } },
      select: { status: true },
    })
    if (!req || req.status !== "APPROVED") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return NextResponse.json({
    rideStatus: route.rideStatus ?? "IDLE",
    lat:        route.liveTrackLat,
    lng:        route.liveTrackLng,
    updatedAt:  route.liveTrackAt,
  })
}
