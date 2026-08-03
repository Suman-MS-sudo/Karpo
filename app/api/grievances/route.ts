import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

const CATEGORIES = ["BUG", "FEATURE_REQUEST", "PAYMENT", "ACCOUNT", "OTHER"]

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

  // Admins see new concerns via the badge/count on the Concerns tab
  // (app/(admin)/admin/concerns) rather than through the notification bell.
  const grievance = await prisma.appGrievance.create({
    data: { userId: session.user.id, category, message: message.trim() },
  })

  return NextResponse.json({ ok: true, id: grievance.id })
}
