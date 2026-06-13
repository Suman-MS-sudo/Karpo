import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { amount, message } = await req.json()
  if (!amount || typeof amount !== "number" || amount < 1) {
    return NextResponse.json({ error: "Invalid offer amount" }, { status: 400 })
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { userId: true, title: true, isNegotiable: true, status: true },
  })

  if (!listing || listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing not found or inactive" }, { status: 404 })
  }
  if (listing.userId === session.user.id) {
    return NextResponse.json({ error: "Cannot make an offer on your own listing" }, { status: 400 })
  }
  if (!listing.isNegotiable) {
    return NextResponse.json({ error: "This listing is not accepting offers" }, { status: 400 })
  }

  const offer = await prisma.listingOffer.upsert({
    where: { listingId_buyerId: { listingId: params.id, buyerId: session.user.id } },
    update: { amount, message: message || null, status: "PENDING" },
    create: { listingId: params.id, buyerId: session.user.id, amount, message: message || null },
  })

  // Notify seller
  await prisma.notification.create({
    data: {
      userId: listing.userId,
      type: "OFFER",
      title: "New offer received",
      body: `Someone offered ₹${amount.toLocaleString("en-IN")} on "${listing.title}"`,
      link: `/marketplace/${params.id}`,
    },
  })

  return NextResponse.json({ offer })
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { userId: true },
  })

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (listing.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const offers = await prisma.listingOffer.findMany({
    where: { listingId: params.id },
    orderBy: { amount: "desc" },
    include: {
      buyer: {
        select: {
          name: true,
          email: true,
          company: { select: { name: true } },
        },
      },
    },
  })

  return NextResponse.json({ offers })
}
