import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(req: Request) {
  const { error } = await requireVerified()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      ...(searchParams.get("category") ? { category: searchParams.get("category")! } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { instructor: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
  })
  return NextResponse.json({ data: courses })
}

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error

  const body = await req.json()
  const course = await prisma.course.create({
    data: {
      instructorId: session.user.id,
      title: body.title,
      description: body.description,
      category: body.category,
      price: body.price ?? 0,
      duration: body.duration,
      mode: body.mode,
      schedule: body.schedule,
      images: body.images ?? [],
    },
  })
  return NextResponse.json(course, { status: 201 })
}
