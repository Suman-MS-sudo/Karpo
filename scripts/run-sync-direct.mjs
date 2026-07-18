/**
 * Runs the affiliate sync directly (bypasses the HTTP endpoint).
 * Tests Amazon API and updates Turso DB.
 */

import { createClient } from "@libsql/client"

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const clientId     = process.env.AMAZON_CLIENT_ID
const clientSecret = process.env.AMAZON_CLIENT_SECRET
const tag          = process.env.AMAZON_ASSOCIATE_TAG ?? "phoenixcomp0e-21"

// ── 1. Get token ──────────────────────────────────────────────────────────────
console.log("Getting Amazon token…")
const tokenRes = await fetch("https://api.amazon.co.uk/auth/o2/token", {
  method:  "POST",
  headers: { "Content-Type": "application/json" },
  body:    JSON.stringify({
    grant_type:    "client_credentials",
    client_id:     clientId,
    client_secret: clientSecret,
    scope:         "creatorsapi::default",
  }),
})
const tokenData = await tokenRes.json()
if (!tokenRes.ok) {
  console.error("Token failed:", tokenData)
  process.exit(1)
}
const token = tokenData.access_token
console.log("Token OK ✓\n")

// ── 2. Search categories ──────────────────────────────────────────────────────
const SEARCHES = [
  { category: "ELECTRONICS",    keywords: "smartphones bestseller india" },
  { category: "ELECTRONICS",    keywords: "laptop deals india" },
  { category: "ELECTRONICS",    keywords: "headphones earbuds deals" },
  { category: "ELECTRONICS",    keywords: "smartwatch deals india" },
  { category: "FASHION",        keywords: "formal shirts men india" },
  { category: "HEALTH_FITNESS", keywords: "protein supplements india" },
  { category: "SHOPPING",       keywords: "home appliances kitchen deals" },
  { category: "LIFESTYLE",      keywords: "skincare grooming deals" },
  { category: "TRAVEL",         keywords: "travel bags luggage deals" },
  { category: "SOFTWARE",       keywords: "antivirus software india" },
]

const RESOURCES = [
  "itemInfo.title",
  "itemInfo.features",
  "itemInfo.byLineInfo",
  "offersV2.listings.price",
  "offersV2.listings.dealDetails",
  "offersV2.listings.isBuyBoxWinner",
  "images.primary.medium",
]

const products = []

for (const { category, keywords } of SEARCHES) {
  process.stdout.write(`  Searching: "${keywords}"… `)
  try {
    const res = await fetch("https://creatorsapi.amazon/catalog/v1/searchItems", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
        "x-marketplace": "www.amazon.in",
      },
      body: JSON.stringify({
        keywords,
        itemCount:   8,
        partnerTag:  tag,
        partnerType: "Associates",
        resources:   RESOURCES,
      }),
    })

    if (!res.ok) {
      const t = await res.text()
      console.log(`FAIL (${res.status})`, t.slice(0, 200))
      continue
    }

    const data = await res.json()
    const items = data?.searchResult?.items ?? []
    console.log(`${items.length} items`)

    for (const item of items) {
      const asin    = item.asin
      const listing = (item?.offersV2?.listings ?? []).find(l => l.isBuyBoxWinner) ?? item?.offersV2?.listings?.[0]
      const salePrice = listing?.price?.amount ?? 0
      if (salePrice === 0) continue

      const origPrice = salePrice + (listing?.dealDetails?.savings?.amount ?? 0)
      const discountPct = origPrice > salePrice
        ? Math.round(((origPrice - salePrice) / origPrice) * 100)
        : 5

      products.push({
        externalId:      `amazon_${asin}`,
        title:           (item?.itemInfo?.title?.displayValue ?? "Amazon Deal").slice(0, 120),
        description:     (item?.itemInfo?.features?.displayValues ?? []).slice(0, 3).join(" • "),
        originalPrice:   origPrice,
        salePrice,
        discount:        Math.max(discountPct, 5),
        affiliateUrl:    `https://www.amazon.in/dp/${asin}?tag=${tag}`,
        imageUrl:        item?.images?.primary?.medium?.url ?? "",
        merchantName:    "Amazon India",
        category,
        affiliateNetwork:"AMAZON",
        featured:        discountPct >= 30,
        trending:        discountPct >= 20,
        badge:           discountPct >= 40 ? "LIMITED_TIME" : discountPct >= 20 ? "TRENDING" : null,
      })
    }
  } catch (err) {
    console.log(`ERROR: ${err.message}`)
  }
}

console.log(`\nFetched ${products.length} Amazon products\n`)

if (products.length === 0) {
  console.log("No products returned — API may still be under review (up to 48hrs). Keeping existing deals.")
  process.exit(0)
}

// ── 3. Delete old API-sourced deals, keep MANUAL ones ────────────────────────
console.log("Removing old API deals…")
await db.execute("DELETE FROM DealRedemption WHERE dealId IN (SELECT id FROM Deal WHERE source = 'API')")
await db.execute("DELETE FROM Deal WHERE source = 'API'")

// ── 4. Upsert new deals ───────────────────────────────────────────────────────
const now        = new Date()
const validUntil = new Date(now.getTime() + 24 * 60 * 60_000).toISOString()

let inserted = 0
for (const p of products) {
  const id = `deal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  try {
    await db.execute({
      sql: `INSERT INTO Deal (
        id, merchantId, title, description, discount,
        validUntil, category, images, isActive,
        merchantName, affiliateUrl, website, affiliateNetwork,
        originalPrice, salePrice, externalId,
        featured, trending, badge,
        source, lastUpdated, createdAt, updatedAt
      ) VALUES (
        ?, 'affiliate-sync', ?, ?, ?,
        ?, ?, ?, 1,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        'API', ?, ?, ?
      )`,
      args: [
        id,
        p.title, p.description, p.discount,
        validUntil, p.category,
        p.imageUrl ? JSON.stringify([p.imageUrl]) : "[]",
        p.merchantName, p.affiliateUrl, p.affiliateUrl, p.affiliateNetwork,
        p.originalPrice, p.salePrice, p.externalId,
        p.featured ? 1 : 0, p.trending ? 1 : 0, p.badge ?? null,
        now.toISOString(), now.toISOString(), now.toISOString(),
      ],
    })
    inserted++
  } catch (err) {
    console.error(`  Skipping ${p.externalId}: ${err.message}`)
  }
}

console.log(`✓ Inserted ${inserted} live Amazon deals\n`)
console.log("Done! Refresh /deals to see live data.")
process.exit(0)
