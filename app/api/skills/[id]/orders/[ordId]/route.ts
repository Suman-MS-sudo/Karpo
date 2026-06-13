import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

// Valid seller actions per status
const SELLER_ACTIONS: Record<string, string[]> = {
  INQUIRY:      ["CONFIRM", "DECLINE", "COUNTER"],
  NEGOTIATING:  ["CONFIRM", "DECLINE", "COUNTER"],
  CONFIRMED:    ["START", "CANCEL"],
  IN_PROGRESS:  ["DELIVER", "CANCEL"],
}
// Valid buyer actions per status
const BUYER_ACTIONS: Record<string, string[]> = {
  NEGOTIATING:  ["ACCEPT", "DECLINE", "COUNTER"],
  DELIVERED:    ["COMPLETE", "DISPUTE"],
  CONFIRMED:    ["CANCEL"],
}

const STATUS_MAP: Record<string, string> = {
  CONFIRM:   "CONFIRMED",
  DECLINE:   "DECLINED",
  COUNTER:   "NEGOTIATING",
  START:     "IN_PROGRESS",
  DELIVER:   "DELIVERED",
  CANCEL:    "CANCELLED",
  ACCEPT:    "CONFIRMED",
  COMPLETE:  "COMPLETED",
  DISPUTE:   "DISPUTED",
}

export async function GET(_req: NextRequest, { params }: { params: { id: string; ordId: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const order = await prisma.skillOrder.findUnique({
    where:   { id: params.ordId },
    include: {
      buyer:  { select: { id: true, name: true, avatarUrl: true, image: true, email: true, phone: true, jobTitle: true, department: true, isVerified: true, company: { select: { name: true } } } },
      seller: { select: { id: true, name: true, avatarUrl: true, image: true, email: true, phone: true, jobTitle: true, isVerified: true } },
      review: true,
    },
  })
  if (!order || (order.buyerId !== session.user.id && order.sellerId !== session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json({ order })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string; ordId: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const order = await prisma.skillOrder.findUnique({
    where:  { id: params.ordId },
    select: { id: true, listingId: true, buyerId: true, sellerId: true, status: true, agreedPrice: true },
  })
  if (!order || order.listingId !== params.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const isSeller = order.sellerId === session.user.id
  const isBuyer  = order.buyerId  === session.user.id
  if (!isSeller && !isBuyer) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body   = await req.json()
  const action = body.action as string

  // Validate action
  const allowed = isSeller ? SELLER_ACTIONS[order.status] ?? [] : BUYER_ACTIONS[order.status] ?? []
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: `Action "${action}" not valid in status "${order.status}"` }, { status: 400 })
  }

  const newStatus = STATUS_MAP[action]
  const now = new Date()
  const updateData: any = { status: newStatus }

  if (action === "COUNTER") {
    if (!body.counterPrice) return NextResponse.json({ error: "counterPrice required for COUNTER" }, { status: 400 })
    updateData.counterPrice = Number(body.counterPrice)
    updateData.agreedPrice  = Number(body.counterPrice)
  }
  if (action === "CONFIRM" || action === "ACCEPT") {
    if (body.sessionDate) updateData.sessionDate = new Date(body.sessionDate)
    if (body.sessionTime) updateData.sessionTime = body.sessionTime
    if (body.meetLink)    updateData.meetLink     = body.meetLink
  }
  if (action === "DELIVER") {
    updateData.deliveryNote  = body.deliveryNote  || null
    updateData.deliverables  = Array.isArray(body.deliverables) ? body.deliverables : []
    updateData.deliveredAt   = now
  }
  if (action === "COMPLETE") {
    updateData.completedAt = now
    // Update listing completedOrders counter
    await prisma.skillListing.update({ where: { id: params.id }, data: { completedOrders: { increment: 1 } } })
  }
  if (action === "CANCEL") {
    updateData.cancelledAt  = now
    updateData.cancelReason = body.cancelReason || null
  }
  if (action === "DISPUTE") {
    updateData.disputeReason    = body.disputeReason    || null
    updateData.disputeNote      = body.disputeNote      || null
    updateData.disputeOpenedAt  = now
  }
  if (action === "DECLINE" && isSeller && body.sellerNote) {
    updateData.sellerNote = body.sellerNote
  }
  if (body.paymentMode)   updateData.paymentMode   = body.paymentMode
  if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus
  if (body.sellerNote && isSeller) updateData.sellerNote = body.sellerNote

  const updated = await prisma.skillOrder.update({ where: { id: params.ordId }, data: updateData })

  // Fetch parties for notifications
  const [buyer, seller, listing] = await Promise.all([
    prisma.user.findUnique({ where: { id: order.buyerId  }, select: { name: true } }),
    prisma.user.findUnique({ where: { id: order.sellerId }, select: { name: true } }),
    prisma.skillListing.findUnique({ where: { id: params.id }, select: { title: true } }),
  ])

  const notifs: { userId: string; title: string; body: string }[] = []

  if (action === "CONFIRM" || action === "ACCEPT") {
    notifs.push({ userId: order.buyerId, title: "Order confirmed! 🎉", body: `${seller?.name ?? "Seller"} confirmed your order for "${listing?.title}". Check for session details.` })
  } else if (action === "DECLINE") {
    const target = isSeller ? order.buyerId : order.sellerId
    notifs.push({ userId: target, title: "Order update", body: `Your order for "${listing?.title}" was declined.` })
  } else if (action === "COUNTER") {
    const target = isSeller ? order.buyerId : order.sellerId
    notifs.push({ userId: target, title: "Counter-offer received 💬", body: `A new price has been proposed for "${listing?.title}". Review and respond.` })
  } else if (action === "START") {
    notifs.push({ userId: order.buyerId, title: "Work has started! 🚀", body: `${seller?.name ?? "Seller"} has started working on your "${listing?.title}" order.` })
  } else if (action === "DELIVER") {
    notifs.push({ userId: order.buyerId, title: "Delivery ready for review 📦", body: `${seller?.name ?? "Seller"} has delivered "${listing?.title}". Please review and approve.` })
  } else if (action === "COMPLETE") {
    notifs.push({ userId: order.sellerId, title: "Order completed! ✅", body: `${buyer?.name ?? "Buyer"} approved your delivery for "${listing?.title}". Please ask them to leave a review!` })
  } else if (action === "DISPUTE") {
    notifs.push({ userId: order.sellerId, title: "Dispute raised ⚠️", body: `${buyer?.name ?? "Buyer"} raised a dispute on order for "${listing?.title}".` })
  } else if (action === "CANCEL") {
    const target = isSeller ? order.buyerId : order.sellerId
    notifs.push({ userId: target, title: "Order cancelled", body: `The order for "${listing?.title}" has been cancelled.` })
  }

  if (notifs.length > 0) {
    await Promise.all(notifs.map((n) =>
      prisma.notification.create({ data: { ...n, type: "GENERAL", link: `/skills/${params.id}` } })
    ))
  }

  return NextResponse.json({ order: updated })
}
