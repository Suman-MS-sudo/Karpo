import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

const CATEGORIES = ["BUG", "FEATURE_REQUEST", "HARASSMENT", "PAYMENT", "ACCOUNT", "OTHER"]

export async function GET() {
  const { session, error } = await requireAuth()
  if (error) return error

  const grievances = await prisma.appGrievance.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(grievances)
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { category, message } = await req.json()
  if (!category || !CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "A valid category is required" }, { status: 400 })
  }
  if (!message || typeof message !== "string" || message.trim().length < 10) {
    return NextResponse.json({ error: "Please describe the issue in at least 10 characters" }, { status: 400 })
  }

  const grievance = await prisma.appGrievance.create({
    data: { userId: session.user.id, category, message: message.trim() },
  })

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "GRIEVANCE",
        title: "New app concern reported",
        body: `${session.user.name ?? session.user.email} reported: ${category.replace(/_/g, " ")}`,
        link: `/admin/reports`,
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ ok: true, id: grievance.id })
}
