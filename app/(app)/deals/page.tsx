import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { FREE_LIMITS } from "@/lib/limits"
import { DealsClient } from "./DealsClient"
import type { Deal } from "@/hooks/useDeals"

export const dynamic = "force-dynamic"

function serializeDeal(d: any): Deal {
  return {
    id:           d.id,
    title:        d.title,
    description:  d.description,
    discount:     d.discount,
    code:         d.code         ?? null,
    validFrom:    d.validFrom    ? new Date(d.validFrom).toISOString()    : null,
    validUntil:   new Date(d.validUntil).toISOString(),
    category:     d.category,
    images:       Array.isArray(d.images) ? d.images : (typeof d.images === "string" ? JSON.parse(d.images || "[]") : []),
    merchantName: d.merchantName ?? "",
    merchantUrl:  d.merchantUrl  ?? null,
    companyLogo:  d.companyLogo  ?? null,
    website:      d.website      ?? null,
    usageLimit:   d.usageLimit   ?? null,
    usedCount:    d.usedCount    ?? 0,
    viewCount:    d.viewCount    ?? 0,
    featured:     !!d.featured,
    trending:     !!d.trending,
    badge:        d.badge        ?? null,
    source:          d.source          ?? "MANUAL",
    lastUpdated:     d.lastUpdated  ? new Date(d.lastUpdated).toISOString() : new Date(d.updatedAt).toISOString(),
    createdAt:       new Date(d.createdAt).toISOString(),
    updatedAt:       new Date(d.updatedAt).toISOString(),
    // Affiliate fields
    affiliateUrl:     d.affiliateUrl     ?? null,
    affiliateNetwork: d.affiliateNetwork ?? null,
    originalPrice:    d.originalPrice    ?? null,
    salePrice:        d.salePrice        ?? null,
    externalId:       d.externalId       ?? null,
  }
}

export default async function DealsPage() {
  const session   = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  const now       = new Date()
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const activeWhere = { isActive: true, validUntil: { gte: now } }

  const [rawDeals, rawFeatured, rawTrending, rawExpiringSoon, redemptionCount] = await Promise.all([
    // All active deals — default sort: highest discount
    prisma.deal.findMany({
      where:   activeWhere,
      orderBy: [{ discount: "desc" }, { createdAt: "desc" }],
      take:    100,
    }),
    // Featured deals
    prisma.deal.findMany({
      where:   { ...activeWhere, featured: true },
      orderBy: { discount: "desc" },
      take:    8,
    }),
    // Trending deals
    prisma.deal.findMany({
      where:   { ...activeWhere, trending: true },
      orderBy: [{ viewCount: "desc" }, { usedCount: "desc" }],
      take:    6,
    }),
    // Expiring within 3 days
    prisma.deal.findMany({
      where:   { ...activeWhere, validUntil: { lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) } },
      orderBy: { validUntil: "asc" },
      take:    6,
    }),
    // Monthly redemptions for free users
    session?.user?.id && !isPremium
      ? prisma.dealRedemption.count({
          where: { userId: session.user.id, redeemedAt: { gte: monthStart } },
        })
      : Promise.resolve(0),
  ])

  return (
    <DealsClient
      initialDeals={rawDeals.map(serializeDeal)}
      featuredDeals={rawFeatured.map(serializeDeal)}
      trendingDeals={rawTrending.map(serializeDeal)}
      expiringSoon={rawExpiringSoon.map(serializeDeal)}
      redemptionCount={redemptionCount}
      isPremium={isPremium}
    />
  )
}
