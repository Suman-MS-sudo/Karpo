import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { FREE_LIMITS } from "@/lib/limits"
import { DealsClient } from "./DealsClient"
import type { Deal } from "@/hooks/useDeals"

export const dynamic = "force-dynamic"

export default async function DealsPage() {
  const session   = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  // Monthly redemption count for free-tier users.
  let redemptionCount = 0
  if (session?.user?.id && !isPremium && (prisma as any).dealRedemption) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    redemptionCount = await (prisma as any).dealRedemption.count({
      where: { userId: session.user.id, redeemedAt: { gte: monthStart } },
    })
  }

  // Initial SSR fetch — default sort (highest discount) with no filters applied.
  const rawDeals = await prisma.deal.findMany({
    where: {
      isActive: true,
      validUntil: { gte: new Date() },
    },
    orderBy: [{ discount: "desc" }, { createdAt: "desc" }],
    take: 60,
  })

  // Serialize to plain objects so Next.js can pass them to the client component.
  const initialDeals: Deal[] = rawDeals.map((d) => ({
    id:             d.id,
    title:          d.title,
    description:    d.description,
    discount:       d.discount,
    code:           d.code,
    validUntil:     d.validUntil.toISOString(),
    category:       d.category,
    images:         d.images,
    merchantName:   d.merchantName,
    merchantUrl:    d.merchantUrl ?? null,
    website:        d.website ?? null,
    usageLimit:     d.usageLimit ?? null,
    usedCount:      d.usedCount,
    createdAt:      d.createdAt.toISOString(),
    updatedAt:      d.updatedAt.toISOString(),
  }))

  return (
    <DealsClient
      initialDeals={initialDeals}
      redemptionCount={redemptionCount}
      isPremium={isPremium}
    />
  )
}
