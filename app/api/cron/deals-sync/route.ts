/**
 * POST /api/cron/deals-sync
 *
 * Called by the hourly CCR trigger (or manually by admins).
 * Fetches best deals from Amazon and Flipkart affiliate APIs,
 * upserts them into the Deal table, and marks stale ones inactive.
 *
 * Protected by Authorization: Bearer <CRON_SECRET>
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { fetchAllAffiliateDeals } from "@/lib/affiliates"

const VALID_DAYS = 1  // affiliate deals expire daily; refreshed each sync

export async function POST(req: Request) {
  // Auth check — accepts either Vercel cron header or manual Bearer token
  const authHeader      = req.headers.get("Authorization") ?? ""
  const vercelCronToken = req.headers.get("x-vercel-cron-token") ?? ""
  const cronSecret      = process.env.CRON_SECRET ?? ""

  const isVercelCron = vercelCronToken !== "" // Vercel injects this automatically
  const isBearerAuth = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !isBearerAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const products = await fetchAllAffiliateDeals()

  let created = 0
  let updated  = 0
  const seenExternalIds: string[] = []

  const validUntil = new Date(Date.now() + VALID_DAYS * 24 * 60 * 60 * 1000)

  for (const p of products) {
    seenExternalIds.push(p.externalId)

    const payload = {
      title:           p.title,
      description:     p.description,
      discount:        Math.max(1, p.discount),
      merchantName:    p.merchantName,
      affiliateUrl:    p.affiliateUrl,
      website:         p.affiliateUrl,     // also set website for backward compat
      affiliateNetwork: p.affiliateNetwork,
      originalPrice:   p.originalPrice,
      salePrice:       p.salePrice,
      images:          p.imageUrl ? JSON.stringify([p.imageUrl]) : "[]",
      category:        p.category,
      source:          "API",
      isActive:        true,
      validUntil,
      lastUpdated:     new Date(),
      featured:        p.discount >= 40,
      trending:        p.discount >= 30,
      badge:           p.discount >= 50 ? "LIMITED_TIME" : p.discount >= 30 ? "TRENDING" : null,
    }

    const existing = await prisma.deal.findFirst({ where: { externalId: p.externalId } })

    if (existing) {
      await prisma.deal.update({ where: { id: existing.id }, data: payload })
      updated++
    } else {
      await prisma.deal.create({
        data: {
          ...payload,
          externalId: p.externalId,
          merchantId: "affiliate-sync",
          code:       null,
        },
      })
      created++
    }
  }

  // Deactivate affiliate deals that were NOT returned in this sync (no longer available)
  if (seenExternalIds.length > 0) {
    await prisma.deal.updateMany({
      where: {
        source:     "API",
        externalId: { notIn: seenExternalIds },
        isActive:   true,
      },
      data: { isActive: false },
    })
  }

  return NextResponse.json({ ok: true, created, updated, total: products.length })
}

// Allow admin to trigger manually via GET from browser
export async function GET(req: Request) {
  return POST(req)
}
