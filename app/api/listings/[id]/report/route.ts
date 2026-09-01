import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { pushNotification } from "@/lib/notify"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { reason, details } = await req.json()
  if (!reason) return NextResponse.json({ error: "Reason is required" }, { status: 400 })

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { userId: true, title: true },
  })
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  if (listing.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot report your own listing" }, { status: 400 })
  }

  // Upsert: one report per user per listing
  const report = await prisma.listingReport.upsert({
    where: { listingId_userId: { listingId: params.id, userId: session.user.id } },
    update: { reason, details: details || null },
    create: { listingId: params.id, userId: session.user.id, reason, details: details || null },
  })

  // Notify admins via a notification targeted at each ADMIN user, with the
  // reporter's identity and full details so nothing requires a separate lookup.
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
  if (admins.length > 0) {
    const reporter = session.user.name ?? session.user.email ?? "A user"
    const notifications = await prisma.$transaction(
      admins.map((a) =>
        prisma.notification.create({
          data: {
            userId: a.id,
            type:   "REPORT",
            title:  `Listing reported: ${listing.title}`,
            body:   `Reported by ${reporter} (${session.user.email}). Reason: ${reason}${details ? `. Details: ${details}` : ""}`,
            link:   `/marketplace/${params.id}`,
          },
        })
      )
    )
    notifications.forEach(pushNotification)
  }

  return NextResponse.json({ ok: true, reportId: report.id })
}
