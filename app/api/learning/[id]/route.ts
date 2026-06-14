import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireVerified()
  if (error) return error

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      instructor: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      _count: { select: { enrollments: true } },
    },
  })

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(course)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const course = await prisma.course.findUnique({ where: { id: params.id }, select: { instructorId: true } })
  if (!course || course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const allowed = [
    "title","description","category","price","duration","mode","schedule","images","isActive",
    "level","tags","prerequisites","maxStudents","curriculum","certificate","language",
  ]
  const data: Record<string, unknown> = {}
  for (const k of allowed) { if (k in body) data[k] = body[k] }

  const updated = await prisma.course.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const course = await prisma.course.findUnique({ where: { id: params.id }, select: { instructorId: true } })
  if (!course || course.instructorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await prisma.course.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
