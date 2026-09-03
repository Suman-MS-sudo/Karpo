import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"
import { pushNotification } from "@/lib/notify"

type Ctx = { params: { id: string; engagementId: string } }

const VALID_ACTIONS: Record<string, string[]> = {
  INTEREST: ["ACCEPT", "DECLINE"],
  VISIT:    ["CONFIRM", "DECLINE", "DONE", "CLOSE_DEAL"],
}

const ACTION_STATUS: Record<string, string> = {
  ACCEPT:     "ACCEPTED",
  CONFIRM:    "CONFIRMED",
  DECLINE:    "DECLINED",
  DONE:       "DONE",
  CLOSE_DEAL: "ACCEPTED",
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { action } = (await req.json()) as { action: string }

  const engagement = await prisma.listingEngagement.findUnique({
    where: { id: params.engagementId },
    include: {
      listing: { select: { userId: true, title: true, id: true, price: true } },
    },
  })

  if (!engagement) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (engagement.listing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const allowed = VALID_ACTIONS[engagement.type] ?? ["ACCEPT", "DECLINE"]
  if (!allowed.includes(action)) {
    return NextResponse.json(
      { error: `Invalid action '${action}' for type '${engagement.type}'` },
      { status: 400 }
    )
  }

  if (action === "DONE" && engagement.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Visit must be confirmed before marking done" }, { status: 400 })
  }
  if (action === "CLOSE_DEAL" && engagement.status !== "DONE") {
    return NextResponse.json({ error: "Visit must be marked done before closing the deal" }, { status: 400 })
  }

  const newStatus = ACTION_STATUS[action]
  const listingTitle = engagement.listing.title

  if (action === "ACCEPT") {
    // Notify only — no auto-message. An auto-message used to hand the
    // seller's phone number straight to the buyer, bypassing in-app
    // messaging entirely (and any contact-exchange monetization down the
    // line). The seller now reaches out deliberately via "Message Buyer".
    const [, notification] = await prisma.$transaction([
      prisma.listingEngagement.update({
        where: { id: params.engagementId },
        data:  { status: newStatus },
      }),
      prisma.notification.create({
        data: {
          userId: engagement.userId,
          type:   "OFFER_ACCEPTED",
          title:  "Seller accepted your interest! 🎉",
          body:   `The seller of "${listingTitle}" accepted your interest. They'll message you here to arrange next steps.`,
          link:   `/marketplace/${engagement.listing.id}`,
        },
      }),
    ])
    pushNotification(notification)
  } else if (action === "CONFIRM") {
    const visitInfo = engagement.visitDate
      ? `${new Date(engagement.visitDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}${engagement.visitTime ? ` · ${engagement.visitTime.charAt(0) + engagement.visitTime.slice(1).toLowerCase()}` : ""}`
      : "as requested"

    const [, notification] = await prisma.$transaction([
      prisma.listingEngagement.update({
        where: { id: params.engagementId },
        data:  { status: newStatus },
      }),
      prisma.notification.create({
        data: {
          userId: engagement.userId,
          type:   "OFFER_ACCEPTED",
          title:  "Site visit confirmed! 📅",
          body:   `Your visit to see "${listingTitle}" is confirmed for ${visitInfo}. Message the seller here if you need to coordinate.`,
          link:   `/marketplace/${engagement.listing.id}`,
        },
      }),
    ])
    pushNotification(notification)
  } else if (action === "DONE") {
    await prisma.listingEngagement.update({
      where: { id: params.engagementId },
      data:  { status: newStatus },
    })
  } else if (action === "CLOSE_DEAL") {
    // Marks the deal as agreed — listing stays ACTIVE until owner explicitly clicks "Mark Sold"
    const [, notification] = await prisma.$transaction([
      prisma.listingEngagement.update({
        where: { id: params.engagementId },
        data:  { status: "ACCEPTED" },
      }),
      prisma.notification.create({
        data: {
          userId: engagement.userId,
          type:   "OFFER_ACCEPTED",
          title:  "Deal confirmed! 🎉",
          body:   `Your visit to see "${listingTitle}" turned into a deal. Congratulations! Message the seller here to coordinate the handover.`,
          link:   `/marketplace/${engagement.listing.id}`,
        },
      }),
    ])
    pushNotification(notification)
  } else {
    // DECLINE
    const [, notification] = await prisma.$transaction([
      prisma.listingEngagement.update({
        where: { id: params.engagementId },
        data:  { status: newStatus },
      }),
      prisma.notification.create({
        data: {
          userId: engagement.userId,
          type:   "OFFER_DECLINED",
          title:  "Update on your listing interest",
          body:   `The seller has declined your ${engagement.type.toLowerCase()} for "${listingTitle}".`,
          link:   `/marketplace/${engagement.listing.id}`,
        },
      }),
    ])
    pushNotification(notification)
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
