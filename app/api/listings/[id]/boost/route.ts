import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"
import { createOrder, BOOST_PRICE_MAP } from "@/lib/payments"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const listing = await prisma.listing.findUnique({ where: { id: params.id } })
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  if (listing.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  if (listing.status !== "ACTIVE") return NextResponse.json({ error: "Only active listings can be boosted" }, { status: 400 })

  const body = await req.json()
  const tier = BOOST_PRICE_MAP[body.level as string]
  if (!tier) return NextResponse.json({ error: "Invalid boost level" }, { status: 400 })

  const receipt = `boost_${params.id}_${Date.now()}`
  const order = await createOrder(tier.price, receipt, {
    userId: session.user.id,
    type: "LISTING_BOOST",
    listingId: params.id,
    boostLevel: body.level,
  })

  await prisma.payment.create({
    data: {
      userId:          session.user.id,
      amount:          tier.price,
      type:            "LISTING_BOOST",
      status:          "PENDING",
      razorpayOrderId: order.id as string,
      metadata:        JSON.stringify({ listingId: params.id, boostLevel: body.level }),
    },
  })

  return NextResponse.json({ orderId: order.id, amount: tier.price })
}
