import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const listing = await prisma.skillListing.findUnique({
    where:  { id: params.id },
    select: { userId: true, title: true, status: true, maxClientsPerMonth: true, packages: true },
  })
  if (!listing || listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing not available" }, { status: 404 })
  }
  if (listing.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot order your own listing" }, { status: 400 })
  }

  const existing = await prisma.skillOrder.findFirst({
    where: { listingId: params.id, buyerId: session.user.id, status: { notIn: ["DECLINED", "CANCELLED"] } },
  })
  if (existing) {
    return NextResponse.json({ error: "You already have an active order for this listing", existing }, { status: 400 })
  }

  // Enforce max clients/month if set
  if (listing.maxClientsPerMonth) {
    const start  = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0)
    const active = await prisma.skillOrder.count({ where: { listingId: params.id, status: { notIn: ["DECLINED", "CANCELLED"] }, createdAt: { gte: start } } })
    if (active >= listing.maxClientsPerMonth) {
      return NextResponse.json({ error: "Seller's calendar is full for this month" }, { status: 400 })
    }
  }

  const body = await req.json()
  const { packageName, packageIdx, agreedPrice, requirements, buyerNote, paymentMode } = body

  if (!agreedPrice) return NextResponse.json({ error: "agreedPrice is required" }, { status: 400 })

  const order = await prisma.skillOrder.create({
    data: {
      listingId:   params.id,
      buyerId:     session.user.id,
      sellerId:    listing.userId,
      packageName: packageName  || null,
      packageIdx:  packageIdx   != null ? Number(packageIdx) : null,
      agreedPrice: Number(agreedPrice),
      requirements: requirements || null,
      buyerNote:    buyerNote    || null,
      paymentMode:  paymentMode  || null,
    },
  })

  // Increment listing totalOrders
  await prisma.skillListing.update({ where: { id: params.id }, data: { totalOrders: { increment: 1 } } })

  // Notify seller
  await prisma.notification.create({
    data: {
      userId: listing.userId,
      type:   "GENERAL",
      title:  "New skill order inquiry 🎯",
      body:   `Someone is interested in "${listing.title}". Review and confirm the order.`,
      link:   `/skills/${params.id}`,
    },
  })

  return NextResponse.json({ order }, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const listing = await prisma.skillListing.findUnique({ where: { id: params.id }, select: { userId: true } })
  if (!listing || listing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const orders = await prisma.skillOrder.findMany({
    where:   { listingId: params.id },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: {
        select: {
          id: true, name: true, avatarUrl: true, image: true, email: true,
          jobTitle: true, department: true, isVerified: true,
          company: { select: { name: true } },
        },
      },
      review: { select: { id: true, rating: true, headline: true } },
    },
  })

  return NextResponse.json({ orders })
}
