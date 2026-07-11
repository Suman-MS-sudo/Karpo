import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(req: Request) {
  const { error } = await requireVerified()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const events = await prisma.event.findMany({
    where: {
      isActive: true,
      ...(searchParams.get("category") ? { category: searchParams.get("category")! } : {}),
    },
    orderBy: { date: "asc" },
    take: 40,
    include: {
      organizer: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      _count: { select: { rsvps: true } },
    },
  })
  return NextResponse.json({ data: events })
}

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error

  const body = await req.json()
  const event = await prisma.event.create({
    data: {
      organizerId: session.user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      date: new Date(body.date),
      location: body.location,
      maxParticipants: body.maxParticipants ? parseInt(body.maxParticipants) : undefined,
      fee: body.fee ?? 0,
      images: body.images ?? [],
      agenda: body.agenda ?? undefined,
      onlineLink: body.onlineLink,
      tags: body.tags ?? [],
      requiresApproval: body.requiresApproval ?? false,
    },
  })
  revalidatePath("/dashboard")
  return NextResponse.json(event, { status: 201 })
}
