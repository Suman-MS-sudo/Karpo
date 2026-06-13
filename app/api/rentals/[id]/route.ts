import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

type Ctx = { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { error } = await requireVerified()
  if (error) return error

  const rental = await prisma.rentalPost.findUnique({
    where: { id: params.id },
    include: {
      user: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      inquiries: {
        include: { user: { select: { id: true, name: true, avatarUrl: true, image: true, phone: true, email: true, department: true, jobTitle: true, company: { select: { name: true } } } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Increment view count (fire-and-forget)
  prisma.rentalPost.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } }).catch(() => null)

  return NextResponse.json(rental)
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireVerified()
  if (error) return error

  const rental = await prisma.rentalPost.findUnique({ where: { id: params.id }, select: { userId: true } })
  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (rental.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const allowed = ["title","type","rent","deposit","city","area","availableFrom","description","amenities","images","status","bhk","furnished","floor","totalFloors","bathrooms","gender","occupancy","petsAllowed","phone"]
  const data: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) data[key] = body[key]
  }

  const updated = await prisma.rentalPost.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireVerified()
  if (error) return error

  const rental = await prisma.rentalPost.findUnique({ where: { id: params.id }, select: { userId: true } })
  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (rental.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.rentalPost.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
