import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { pushNotification } from "@/lib/notify"

// PATCH /api/listings/[id]/offers/[offerId]
// Body: { action: "ACCEPT" | "DECLINE" }
// Only the listing owner can call this.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; offerId: string } }
) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { action } = await req.json()
  if (!["ACCEPT", "DECLINE", "REVOKE"].includes(action)) {
    return NextResponse.json({ error: "action must be ACCEPT, DECLINE, or REVOKE" }, { status: 400 })
  }

  // Verify listing ownership
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    select: { userId: true, title: true, status: true, price: true },
  })
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })
  if (listing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (listing.status !== "ACTIVE") {
    return NextResponse.json({ error: "Listing is no longer active" }, { status: 400 })
  }

  // Verify the offer belongs to this listing
  const offer = await prisma.listingOffer.findUnique({
    where: { id: params.offerId },
    select: { id: true, buyerId: true, amount: true, status: true, listingId: true },
  })
  if (!offer || offer.listingId !== params.id) {
    return NextResponse.json({ error: "Offer not found" }, { status: 404 })
  }

  if (action === "REVOKE") {
    await prisma.listingOffer.update({ where: { id: params.offerId }, data: { status: "PENDING" } })
    return NextResponse.json({ ok: true, action })
  }

  if (offer.status !== "PENDING") {
    return NextResponse.json({ error: "Offer has already been responded to" }, { status: 400 })
  }

  if (action === "ACCEPT") {
    // Accept offer and decline all other pending offers — listing stays ACTIVE until owner marks it sold
    const [, , notification] = await prisma.$transaction([
      prisma.listingOffer.update({
        where: { id: params.offerId },
        data: { status: "ACCEPTED" },
      }),
      prisma.listingOffer.updateMany({
        where: { listingId: params.id, id: { not: params.offerId }, status: "PENDING" },
        data: { status: "DECLINED" },
      }),
      // Notify the buyer their offer was accepted
      prisma.notification.create({
        data: {
          userId: offer.buyerId,
          type: "OFFER_ACCEPTED",
          title: "Your offer was accepted! 🎉",
          body: `Your offer of ₹${offer.amount.toLocaleString("en-IN")} on "${listing.title}" was accepted. Message the seller to arrange pickup.`,
          link: `/marketplace/${params.id}`,
        },
      }),
      // Auto-message from seller to buyer
      prisma.message.create({
        data: {
          senderId: session.user.id,
          receiverId: offer.buyerId,
          listingId: params.id,
          listingType: "listing",
          content: `Hi! I've accepted your offer of ₹${offer.amount.toLocaleString("en-IN")} for "${listing.title}". Let's coordinate pickup/delivery. Feel free to message me here.`,
        },
      }),
    ])
    pushNotification(notification)
  } else {
    // Decline: update offer status and notify buyer
    const [, notification] = await prisma.$transaction([
      prisma.listingOffer.update({
        where: { id: params.offerId },
        data: { status: "DECLINED" },
      }),
      prisma.notification.create({
        data: {
          userId: offer.buyerId,
          type: "OFFER_DECLINED",
          title: "Offer not accepted",
          body: `Your offer on "${listing.title}" was not accepted by the seller.`,
          link: `/marketplace/${params.id}`,
        },
      }),
    ])
    pushNotification(notification)
  }

  return NextResponse.json({ ok: true, action })
}
