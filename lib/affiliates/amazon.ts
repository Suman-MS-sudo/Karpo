/**
 * Amazon Product Advertising API 5.0 (PAAPI) fetcher for India.
 *
 * Required env vars:
 *   AMAZON_ACCESS_KEY     – IAM access key from Amazon Associates
 *   AMAZON_SECRET_KEY     – IAM secret key
 *   AMAZON_ASSOCIATE_TAG  – your affiliate tag (e.g. "korpo-21")
 *
 * Docs: https://webservices.amazon.in/paapi5/documentation/
 */

import crypto from "crypto"

const HOST    = "webservices.amazon.in"
const REGION  = "eu-west-1"
const SERVICE = "ProductAdvertisingAPI"
const PATH    = "/paapi5/searchitems"

// Map our deal categories → Amazon search index / keywords
const CATEGORY_SEARCHES = [
  { category: "ELECTRONICS",    searchIndex: "Electronics",   keywords: "bestseller deals" },
  { category: "FASHION",        searchIndex: "Apparel",       keywords: "top deals" },
  { category: "HEALTH_FITNESS", searchIndex: "HealthPersonalCare", keywords: "top deals" },
  { category: "BOOKS",          searchIndex: "Books",         keywords: "bestsellers" },
  { category: "HOME",           searchIndex: "HomeImprovement", keywords: "top deals" },
  { category: "SHOPPING",       searchIndex: "All",           keywords: "best deals today" },
]

function hmac(key: Buffer | string, data: string) {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest()
}
function sha256hex(data: string) {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex")
}

function awsv4Sign(accessKey: string, secretKey: string, body: string) {
  const now   = new Date()
  const amzDate  = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z"
  const dateStamp = amzDate.slice(0, 8)

  const contentType = "application/json; charset=UTF-8"
  const target      = "com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems"

  const headers = {
    "content-encoding": "amz-1.0",
    "content-type":     contentType,
    host:               HOST,
    "x-amz-date":       amzDate,
    "x-amz-target":     target,
  }

  const signedHeaders = Object.keys(headers).sort().join(";")
  const canonicalHeaders = Object.entries(headers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("\n") + "\n"

  const canonicalRequest = [
    "POST", PATH, "",
    canonicalHeaders,
    signedHeaders,
    sha256hex(body),
  ].join("\n")

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    sha256hex(canonicalRequest),
  ].join("\n")

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${secretKey}`, dateStamp), REGION), SERVICE),
    "aws4_request"
  )
  const signature = crypto.createHmac("sha256", signingKey).update(stringToSign).digest("hex")

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`

  return { ...headers, Authorization: authorization }
}

export interface AffiliateProduct {
  externalId:      string
  title:           string
  description:     string
  originalPrice:   number
  salePrice:       number
  discount:        number
  affiliateUrl:    string
  imageUrl:        string
  merchantName:    string
  category:        string
  affiliateNetwork: string
}

export async function fetchAmazonDeals(): Promise<AffiliateProduct[]> {
  const accessKey = process.env.AMAZON_ACCESS_KEY
  const secretKey = process.env.AMAZON_SECRET_KEY
  const tag       = process.env.AMAZON_ASSOCIATE_TAG

  if (!accessKey || !secretKey || !tag) {
    console.warn("[amazon] Missing AMAZON_ACCESS_KEY / AMAZON_SECRET_KEY / AMAZON_ASSOCIATE_TAG — skipping")
    return []
  }

  const results: AffiliateProduct[] = []

  for (const { category, searchIndex, keywords } of CATEGORY_SEARCHES) {
    try {
      const body = JSON.stringify({
        Keywords:    keywords,
        Resources:   [
          "ItemInfo.Title",
          "ItemInfo.Features",
          "Offers.Listings.Price",
          "Offers.Listings.SavingBasis",
          "Offers.Listings.DeliveryInfo.IsPrimeEligible",
          "Images.Primary.Medium",
        ],
        SearchIndex:  searchIndex,
        ItemCount:    5,
        PartnerTag:   tag,
        PartnerType:  "Associates",
        Marketplace:  "www.amazon.in",
      })

      const headers = awsv4Sign(accessKey, secretKey, body)

      const res = await fetch(`https://${HOST}${PATH}`, {
        method:  "POST",
        headers: headers as Record<string, string>,
        body,
      })

      if (!res.ok) {
        console.error(`[amazon] ${searchIndex} HTTP ${res.status}`)
        continue
      }

      const data = await res.json() as any

      for (const item of data?.SearchResult?.Items ?? []) {
        const listing   = item?.Offers?.Listings?.[0]
        const priceData = listing?.Price
        const basisData = listing?.SavingBasis
        const salePrice = priceData?.Amount ?? 0
        const origPrice = basisData?.Amount ?? salePrice
        const discountPct = origPrice > 0 ? Math.round(((origPrice - salePrice) / origPrice) * 100) : 0

        if (salePrice === 0 || discountPct < 5) continue

        results.push({
          externalId:      `amazon_${item.ASIN}`,
          title:           item?.ItemInfo?.Title?.DisplayValue ?? "Amazon Deal",
          description:     item?.ItemInfo?.Features?.DisplayValues?.slice(0, 3).join(" • ") ?? "",
          originalPrice:   origPrice,
          salePrice,
          discount:        discountPct,
          affiliateUrl:    `https://www.amazon.in/dp/${item.ASIN}?tag=${tag}`,
          imageUrl:        item?.Images?.Primary?.Medium?.URL ?? "",
          merchantName:    "Amazon India",
          category,
          affiliateNetwork: "AMAZON",
        })
      }
    } catch (err) {
      console.error(`[amazon] Error fetching ${searchIndex}:`, err)
    }
  }

  return results
}
