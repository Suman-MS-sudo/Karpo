/**
 * Amazon Creators API (v3.2 — LWA OAuth2)
 *
 * Credential version 3.2 uses:
 *   - Token endpoint:  https://api.amazon.co.uk/auth/o2/token
 *   - Scope:           creatorsapi::default
 *   - Body format:     JSON
 *   - API base:        https://creatorsapi.amazon
 *
 * Required env vars:
 *   AMAZON_CLIENT_ID      – Credential ID from Creators console
 *   AMAZON_CLIENT_SECRET  – Credential secret from Creators console
 *   AMAZON_ASSOCIATE_TAG  – Your affiliate/associate tag (e.g. "phoenixcomp0e-21")
 */

const TOKEN_URL   = "https://api.amazon.co.uk/auth/o2/token"
const API_BASE    = "https://creatorsapi.amazon"
const SCOPE       = "creatorsapi::default"
const MARKETPLACE = "www.amazon.in"


let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(clientId: string, clientSecret: string): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.value
  }

  const res = await fetch(TOKEN_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type:    "client_credentials",
      client_id:     clientId,
      client_secret: clientSecret,
      scope:         SCOPE,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Amazon token error ${res.status}: ${text}`)
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  cachedToken = {
    value:     data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return cachedToken.value
}

export interface AffiliateProduct {
  externalId:       string
  title:            string
  description:      string
  originalPrice:    number
  salePrice:        number
  discount:         number
  affiliateUrl:     string
  imageUrl:         string
  merchantName:     string
  category:         string
  affiliateNetwork: string
}

const CATEGORY_SEARCHES = [
  { category: "ELECTRONICS",    keywords: "smartphones laptops deals" },
  { category: "ELECTRONICS",    keywords: "headphones earphones deals" },
  { category: "FASHION",        keywords: "formal shirts men clothing deals" },
  { category: "HEALTH_FITNESS", keywords: "health fitness supplements deals" },
  { category: "SHOPPING",       keywords: "home kitchen appliances deals" },
  { category: "LIFESTYLE",      keywords: "skincare grooming deals" },
]

export async function fetchAmazonDeals(): Promise<AffiliateProduct[]> {
  const clientId     = process.env.AMAZON_CLIENT_ID
  const clientSecret = process.env.AMAZON_CLIENT_SECRET
  const tag          = process.env.AMAZON_ASSOCIATE_TAG

  if (!clientId || !clientSecret || !tag) {
    console.warn("[amazon] Missing AMAZON_CLIENT_ID / AMAZON_CLIENT_SECRET / AMAZON_ASSOCIATE_TAG — skipping")
    return []
  }

  let token: string
  try {
    token = await getAccessToken(clientId, clientSecret)
  } catch (err) {
    console.error("[amazon] Auth failed:", err)
    return []
  }

  const results: AffiliateProduct[] = []

  for (const { category, keywords } of CATEGORY_SEARCHES) {
    try {
      const res = await fetch(`${API_BASE}/catalog/v1/searchItems`, {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
          "x-marketplace": MARKETPLACE,
        },
        body: JSON.stringify({
          keywords,
          itemCount:   5,
          partnerTag:  tag,
          partnerType: "Associates",
          resources:   [
            "itemInfo.title",
            "itemInfo.features",
            "itemInfo.byLineInfo",
            "offersV2.listings.price",
            "offersV2.listings.dealDetails",
            "offersV2.listings.isBuyBoxWinner",
            "images.primary.medium",
          ],
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error(`[amazon] searchItems "${keywords}" HTTP ${res.status}: ${text.slice(0, 300)}`)
        continue
      }

      const data = await res.json() as any

      for (const item of data?.searchResult?.items ?? []) {
        const asin    = item.asin
        // Creators API uses offersV2 (not offers/Offers)
        const listing = (item?.offersV2?.listings ?? []).find((l: any) => l.isBuyBoxWinner)
                        ?? item?.offersV2?.listings?.[0]
        const salePrice = listing?.price?.amount ?? 0
        // dealDetails contains savings info; fall back to salePrice if no deal
        const savingAmt = listing?.dealDetails?.dealPrice?.amount
        const origPrice = savingAmt ? (salePrice + (listing?.dealDetails?.savings?.amount ?? 0)) : salePrice
        const discountPct = origPrice > salePrice
          ? Math.round(((origPrice - salePrice) / origPrice) * 100)
          : 0

        if (salePrice === 0) continue
        // include all deals from Amazon even at 0% off (still affiliate traffic)
        const effectiveDiscount = Math.max(discountPct, 5)

        const title    = item?.itemInfo?.title?.displayValue ?? "Amazon Deal"
        const features: string[] = item?.itemInfo?.features?.displayValues ?? []
        const brand    = item?.itemInfo?.byLineInfo?.brand?.displayValue ?? ""

        results.push({
          externalId:       `amazon_${asin}`,
          title:            title.slice(0, 120),
          description:      features.slice(0, 3).join(" • ") || (brand ? `By ${brand}` : ""),
          originalPrice:    origPrice,
          salePrice,
          discount:         effectiveDiscount,
          affiliateUrl:     `https://www.amazon.in/dp/${asin}?tag=${tag}`,
          imageUrl:         item?.images?.primary?.medium?.url ?? "",
          merchantName:     "Amazon India",
          category,
          affiliateNetwork: "AMAZON",
        })
      }
    } catch (err) {
      console.error(`[amazon] Error fetching "${keywords}":`, err)
    }
  }

  return results
}
