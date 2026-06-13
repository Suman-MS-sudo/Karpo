import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

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

  // Notify admins via a notification targeted at each ADMIN user
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } })
  if (admins.length > 0) {
    await prisma.notification.createMany({
      data: admins.map((a) => ({
        userId: a.id,
        type: "REPORT",
        title: "Listing reported",
        body: `"${listing.title}" was reported for: ${reason}`,
        link: `/marketplace/${params.id}`,
      })),
      skipDuplicates: true,
    })
  }

  return NextResponse.json({ ok: true, reportId: report.id })
}
