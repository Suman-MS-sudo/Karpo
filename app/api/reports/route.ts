import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { pushNotification } from "@/lib/notify"
import { CONTENT_TYPES, isReportableType } from "@/lib/content-moderation"

/** Report a post from any section (rental, skill, event, referral, carpool). */
export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { itemType, itemId, reason, details } = await req.json().catch(() => ({}))
  if (!isReportableType(itemType) || typeof itemId !== "string" || !itemId) {
    return NextResponse.json({ error: "Invalid item" }, { status: 400 })
  }
  if (typeof reason !== "string" || !reason.trim()) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 })
  }

  const cfg  = CONTENT_TYPES[itemType]
  const item = await cfg.load(itemId)
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (item.ownerId === session.user.id) {
    return NextResponse.json({ error: "You cannot report your own post" }, { status: 400 })
  }

  const cleanDetails = typeof details === "string" && details.trim() ? details.trim().slice(0, 500) : null

  // One report per user per post; re-reporting refreshes the reason and reopens it.
  const report = await prisma.contentReport.upsert({
    where:  { itemType_itemId_userId: { itemType, itemId, userId: session.user.id } },
    update: { reason, details: cleanDetails, status: "PENDING" },
    create: { itemType, itemId, userId: session.user.id, reason, details: cleanDetails },
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
            title:  `${cfg.label} reported: ${item.title}`,
            body:   `Reported by ${reporter} (${session.user.email}). Reason: ${reason}${cleanDetails ? `. Details: ${cleanDetails}` : ""}`,
            link:   "/admin/reports",
          },
        })
      )
    )
    notifications.forEach(pushNotification)
  }

  return NextResponse.json({ ok: true, reportId: report.id })
}
