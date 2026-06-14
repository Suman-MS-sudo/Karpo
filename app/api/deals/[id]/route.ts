import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    include: {
      redemptions: session?.user?.id
        ? { where: { userId: session.user.id } }
        : false,
      _count: { select: { redemptions: true } },
    },
  })

  if (!deal || !deal.isActive) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(deal)
}

// Track redemption (user clicked "Redeem")
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireVerified()
  if (error) return error

  const deal = await prisma.deal.findUnique({
    where: { id: params.id },
    select: { isActive: true, validUntil: true, usageLimit: true, usedCount: true },
  })
  if (!deal || !deal.isActive || deal.validUntil < new Date()) {
    return NextResponse.json({ error: "Deal not available" }, { status: 410 })
  }
  if (deal.usageLimit && deal.usedCount >= deal.usageLimit) {
    return NextResponse.json({ error: "Deal usage limit reached" }, { status: 409 })
  }

  // Free users: max 5 deal redemptions per calendar month
  if (session.user.membershipPlan !== "PREMIUM") {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0)
    const monthlyCount = await prisma.dealRedemption.count({
      where: { userId: session.user.id, redeemedAt: { gte: monthStart } },
    })
    if (monthlyCount >= 5) {
      return NextResponse.json(
        { error: "Free plan limit: 5 deal redemptions per month. Upgrade to Premium for unlimited.", limitReached: true },
        { status: 403 }
      )
    }
  }

  const redemption = await prisma.dealRedemption.upsert({
    where: { dealId_userId: { dealId: params.id, userId: session.user.id } },
    create: { dealId: params.id, userId: session.user.id },
    update: { redeemedAt: new Date() },
  })

  // Increment used count
  await prisma.deal.update({ where: { id: params.id }, data: { usedCount: { increment: 1 } } }).catch(() => {})

  return NextResponse.json(redemption, { status: 201 })
}
