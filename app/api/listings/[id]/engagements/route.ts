import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

const TYPE_RANK: Record<string, number> = { INTEREST: 1, VISIT: 2 }

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { type = "INTEREST", visitDate, visitTime, message } = await req.json()

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { userId: true, title: true, status: true },
  })

  if (!listing || listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing not found or inactive" }, { status: 404 })
  }
  if (listing.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot engage with your own listing" }, { status: 400 })
  }

  const existing = await prisma.listingEngagement.findUnique({
    where: { listingId_userId: { listingId: params.id, userId: session.user.id } },
  })

  const incomingRank = TYPE_RANK[type] ?? 1
  const existingRank = existing ? (TYPE_RANK[existing.type] ?? 1) : 0

  if (existing && incomingRank <= existingRank && existing.status !== "DECLINED") {
    return NextResponse.json({ error: "Already engaged with this listing", existing }, { status: 400 })
  }

  const data: any = {
    listingId: params.id,
    userId:    session.user.id,
    type,
    status:    "PENDING",
    message:   message || null,
    visitDate: visitDate ? new Date(visitDate) : null,
    visitTime: visitTime || null,
  }

  const engagement = existing
    ? await prisma.listingEngagement.update({ where: { id: existing.id }, data })
    : await prisma.listingEngagement.create({ data })

  // Notify seller
  const notifBody = type === "VISIT"
    ? `Someone requested a site visit for "${listing.title}".`
    : `Someone showed interest in "${listing.title}".`

  await prisma.notification.create({
    data: {
      userId: listing.userId,
      type:   "OFFER",
      title:  type === "VISIT" ? "New visit request 📅" : "New interest 👀",
      body:   notifBody,
      link:   `/marketplace/${params.id}`,
    },
  })

  return NextResponse.json({ engagement })
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const engagement = await prisma.listingEngagement.findUnique({
    where: { listingId_userId: { listingId: params.id, userId: session.user.id } },
  })

  if (!engagement) return NextResponse.json({ error: "No engagement found" }, { status: 404 })
  if (engagement.type !== "INTEREST" || engagement.status !== "PENDING") {
    return NextResponse.json({ error: "Only pending interests can be revoked" }, { status: 400 })
  }

  await prisma.listingEngagement.delete({ where: { id: engagement.id } })
  return NextResponse.json({ ok: true })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })
  if (!listing || listing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const engagements = await prisma.listingEngagement.findMany({
    where:   { listingId: params.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true, name: true, phone: true,
          avatarUrl: true, image: true, isVerified: true,
          jobTitle: true, department: true,
        },
      },
    },
  })

  return NextResponse.json({ engagements })
}
