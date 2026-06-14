import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireVerified()
  if (error) return error

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      organizer: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      rsvps: { include: { user: { select: { id: true, name: true, image: true, avatarUrl: true } } }, take: 50 },
      _count: { select: { rsvps: true } },
    },
  })

  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(event)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const event = await prisma.event.findUnique({ where: { id: params.id }, select: { organizerId: true } })
  if (!event || event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const allowed = [
    "title","description","category","date","location","maxParticipants","fee","images","isActive",
    "agenda","onlineLink","tags","requiresApproval",
  ]
  const data: Record<string, unknown> = {}
  for (const k of allowed) {
    if (k in body) data[k] = k === "date" ? new Date(body[k]) : body[k]
  }

  const updated = await prisma.event.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const event = await prisma.event.findUnique({ where: { id: params.id }, select: { organizerId: true } })
  if (!event || event.organizerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.event.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
