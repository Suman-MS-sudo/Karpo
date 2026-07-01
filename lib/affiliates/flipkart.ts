/**
 * Flipkart Affiliate API fetcher.
 *
 * Required env vars:
 *   FLIPKART_AFFILIATE_ID     – your Flipkart affiliate ID
 *   FLIPKART_AFFILIATE_TOKEN  – your Flipkart affiliate token
 *
 * Docs: https://affiliate.flipkart.com/api-docs
 */

import type { AffiliateProduct } from "./amazon"

const BASE = "https://affiliate-api.flipkart.net/affiliate/1.0"

// Flipkart category IDs → our deal categories
const CATEGORY_MAP: { fkCategory: string; korpoCategory: string; label: string }[] = [
  { fkCategory: "tyy",     korpoCategory: "ELECTRONICS",    label: "Mobiles" },
  { fkCategory: "ckf",     korpoCategory: "ELECTRONICS",    label: "Laptops" },
  { fkCategory: "2oq",     korpoCategory: "ELECTRONICS",    label: "Televisions" },
  { fkCategory: "clothing",korpoCategory: "FASHION",        label: "Clothing" },
  { fkCategory: "household",korpoCategory: "SHOPPING",      label: "Home & Kitchen" },
]

export async function fetchFlipkartDeals(): Promise<AffiliateProduct[]> {
  const affId    = process.env.FLIPKART_AFFILIATE_ID
  const affToken = process.env.FLIPKART_AFFILIATE_TOKEN

  if (!affId || !affToken) {
    console.warn("[flipkart] Missing FLIPKART_AFFILIATE_ID / FLIPKART_AFFILIATE_TOKEN — skipping")
    return []
  }

  const results: AffiliateProduct[] = []

  for (const { fkCategory, korpoCategory, label } of CATEGORY_MAP) {
    try {
      const url = `${BASE}/offers/v1/json/${fkCategory}?affid=${affId}&token=${affToken}`
      const res = await fetch(url, {
        headers: { "Fk-Affiliate-Id": affId, "Fk-Affiliate-Token": affToken },
        next: { revalidate: 0 },
      })

      if (!res.ok) {
        console.error(`[flipkart] ${label} HTTP ${res.status}`)
        continue
      }

      const data = await res.json() as any
      const products = data?.products ?? data?.docList ?? []

      for (const p of products.slice(0, 8)) {
        const origPrice = p?.productBaseInfoV1?.flipkartSpecialPrice?.amount
          ?? p?.productBaseInfoV1?.mrp?.amount
          ?? p?.mrp
          ?? 0
        const salePrice = p?.productBaseInfoV1?.sellingPrice?.amount
          ?? p?.productBaseInfoV1?.flipkartSpecialPrice?.amount
          ?? p?.sellingPrice
          ?? origPrice
        const discount = origPrice > 0
          ? Math.round(((origPrice - salePrice) / origPrice) * 100)
          : (p?.productBaseInfoV1?.discountPercentage ?? 0)

        if (discount < 5) continue

        const affiliateUrl = p?.productBaseInfoV1?.productUrl ?? p?.url ?? ""
        const imageUrl     = p?.productBaseInfoV1?.images?.["400x400"]?.[0] ?? ""
        const title        = p?.productBaseInfoV1?.title ?? p?.title ?? "Flipkart Deal"

        results.push({
          externalId:      `flipkart_${p?.productBaseInfoV1?.productId ?? p?.pid ?? title.slice(0, 20)}`,
          title:           title.slice(0, 120),
          description:     `${discount}% off on ${label} at Flipkart. ${p?.productBaseInfoV1?.productDescription?.slice(0, 200) ?? ""}`.trim(),
          originalPrice:   origPrice,
          salePrice,
          discount,
          affiliateUrl:    affiliateUrl.includes("affid=") ? affiliateUrl : `${affiliateUrl}${affiliateUrl.includes("?") ? "&" : "?"}affid=${affId}`,
          imageUrl,
          merchantName:    "Flipkart",
          category:        korpoCategory,
          affiliateNetwork: "FLIPKART",
        })
      }
    } catch (err) {
      console.error(`[flipkart] Error fetching ${label}:`, err)
    }
  }

  return results
}
