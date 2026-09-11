import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"
import { pushNotification } from "@/lib/notify"

const REASONS = [
  "Fake or impersonated profile",
  "Harassment or abusive behavior",
  "Scam or fraud attempt",
  "Inappropriate or offensive content",
  "Spam or unwanted solicitation",
  "Other",
]

export async function POST(req: Request, { params }: { params: { userId: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  if (params.userId === session.user.id) {
    return NextResponse.json({ error: "You can't report yourself." }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } })
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 })

  const { reason, details } = await req.json().catch(() => ({}))
  if (!reason || !REASONS.includes(reason)) {
    return NextResponse.json({ error: "Please select a valid reason" }, { status: 400 })
  }
  if (details && (typeof details !== "string" || details.length > 1000)) {
    return NextResponse.json({ error: "Details must be under 1000 characters" }, { status: 400 })
  }

  const report = await prisma.userReport.create({
    data: {
      reporterId: session.user.id,
      reportedId: params.userId,
      reason,
      details: details?.trim() || null,
    },
  })

  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
  if (admins.length > 0) {
    const reporter = session.user.name ?? session.user.email ?? "A user"
    const notifications = await prisma.$transaction(
      admins.map((a) =>
        prisma.notification.create({
          data: {
            userId: a.id,
            type:   "REPORT",
            title:  `User reported: ${reason}`,
            body:   `${reporter} reported a user${details ? `: ${details}` : "."}`,
            link:   `/admin/users`,
          },
        })
      )
    )
    notifications.forEach(pushNotification)
  }

  return NextResponse.json({ ok: true, id: report.id })
}
