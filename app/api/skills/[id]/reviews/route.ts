import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const { orderId, rating, ratingQuality, ratingComm, ratingPunctual, headline, body: reviewBody, wouldRepeat, isAnonymous } = body

  if (!orderId || !rating) return NextResponse.json({ error: "orderId and rating are required" }, { status: 400 })
  if (rating < 1 || rating > 5) return NextResponse.json({ error: "rating must be 1–5" }, { status: 400 })

  const order = await prisma.skillOrder.findUnique({
    where:  { id: orderId },
    select: { id: true, listingId: true, buyerId: true, sellerId: true, status: true },
  })
  if (!order || order.listingId !== params.id || order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Order not found or access denied" }, { status: 403 })
  }
  if (order.status !== "COMPLETED") {
    return NextResponse.json({ error: "Can only review completed orders" }, { status: 400 })
  }

  const existing = await prisma.skillReview.findUnique({ where: { orderId } })
  if (existing) return NextResponse.json({ error: "Already reviewed this order" }, { status: 400 })

  const review = await prisma.skillReview.create({
    data: {
      listingId:      params.id,
      orderId,
      reviewerId:     session.user.id,
      sellerId:       order.sellerId,
      rating:         Number(rating),
      ratingQuality:  ratingQuality  ? Number(ratingQuality)  : null,
      ratingComm:     ratingComm     ? Number(ratingComm)     : null,
      ratingPunctual: ratingPunctual ? Number(ratingPunctual) : null,
      headline:       headline       || null,
      body:           reviewBody     || null,
      wouldRepeat:    wouldRepeat    !== false,
      isAnonymous:    isAnonymous    === true,
    },
  })

  // Recalculate listing avgRating and reviewCount
  const agg = await prisma.skillReview.aggregate({
    where: { listingId: params.id },
    _avg:  { rating: true },
    _count: { id: true },
  })
  await prisma.skillListing.update({
    where: { id: params.id },
    data:  { avgRating: agg._avg.rating ?? null, reviewCount: agg._count.id },
  })

  // Notify seller
  await prisma.notification.create({
    data: {
      userId: order.sellerId,
      type:   "GENERAL",
      title:  "New review received ⭐",
      body:   `You received a ${rating}-star review. Check your listing!`,
      link:   `/skills/${params.id}`,
    },
  })

  return NextResponse.json({ review }, { status: 201 })
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAuth()
  if (error) return error

  const reviews = await prisma.skillReview.findMany({
    where:   { listingId: params.id },
    orderBy: { createdAt: "desc" },
    include: {
      reviewer: { select: { id: true, name: true, avatarUrl: true, image: true, jobTitle: true, department: true } },
    },
  })
  return NextResponse.json({ reviews })
}
