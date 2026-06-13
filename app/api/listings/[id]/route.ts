import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
  })
  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(listing)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const listing = await prisma.listing.findUnique({ where: { id: params.id } })
  if (!listing || listing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const body = await req.json()
  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: {
      title:        body.title,
      description:  body.description,
      price:        body.price,
      category:     body.category,
      condition:    body.condition,
      isNegotiable: body.isNegotiable,
      images:       body.images,
      city:         body.city,
      latitude:     body.latitude  ?? null,
      longitude:    body.longitude ?? null,
      area:         body.area      ?? null,
      brand:        body.brand     ?? null,
      purchaseYear: body.purchaseYear ?? null,
      warranty:     body.warranty  ?? null,
      meetingPref:  body.meetingPref,
      phone:        body.phone     ?? null,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const listing = await prisma.listing.findUnique({ where: { id: params.id } })
  if (!listing || (listing.userId !== session.user.id && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  await prisma.listing.update({ where: { id: params.id }, data: { status: "EXPIRED" } })
  return NextResponse.json({ success: true })
}
