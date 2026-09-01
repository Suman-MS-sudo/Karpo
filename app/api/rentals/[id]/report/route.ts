import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"
import { pushNotification } from "@/lib/notify"

type Ctx = { params: { id: string } }

export async function POST(req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireVerified()
  if (error) return error

  const { reason, details } = await req.json() as { reason: string; details?: string }
  if (!reason) return NextResponse.json({ error: "Reason required" }, { status: 400 })

  const rental = await prisma.rentalPost.findUnique({
    where: { id: params.id },
    select: { userId: true, title: true },
  })
  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (rental.userId === session.user.id) return NextResponse.json({ error: "Cannot report your own listing" }, { status: 400 })

  // Notify all admins, with the reporter's identity and full details so
  // nothing requires a separate lookup.
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
  if (admins.length > 0) {
    const reporter = session.user.name ?? session.user.email ?? "A user"
    const notifications = await prisma.$transaction(
      admins.map((a) =>
        prisma.notification.create({
          data: {
            userId: a.id,
            type:   "ADMIN_REPORT",
            title:  `Rental reported: ${rental.title}`,
            body:   `Reported by ${reporter} (${session.user.email}). Reason: ${reason}${details ? `. Details: ${details}` : ""}`,
            link:   `/rentals/${params.id}`,
          },
        })
      )
    )
    notifications.forEach(pushNotification)
  }

  return NextResponse.json({ ok: true })
}
