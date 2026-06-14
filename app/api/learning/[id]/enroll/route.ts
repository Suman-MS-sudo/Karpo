import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const course = await prisma.course.findUnique({
    where: { id: params.id },
    select: { instructorId: true, isActive: true, maxStudents: true, _count: { select: { enrollments: true } } },
  })
  if (!course || !course.isActive) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 })
  }
  if (course.instructorId === session.user.id) {
    return NextResponse.json({ error: "You cannot enroll in your own course" }, { status: 400 })
  }
  if (course.maxStudents && course._count.enrollments >= course.maxStudents) {
    return NextResponse.json({ error: "Course is full" }, { status: 409 })
  }

  const enrollment = await prisma.courseEnrollment.upsert({
    where: { courseId_userId: { courseId: params.id, userId: session.user.id } },
    create: { courseId: params.id, userId: session.user.id, status: "ENROLLED" },
    update: { status: "ENROLLED" },
  })
  return NextResponse.json(enrollment, { status: 201 })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  await prisma.courseEnrollment.deleteMany({
    where: { courseId: params.id, userId: session.user.id },
  })
  return NextResponse.json({ ok: true })
}
