const clientId     = process.env.AMAZON_CLIENT_ID
const clientSecret = process.env.AMAZON_CLIENT_SECRET
const tag          = process.env.AMAZON_ASSOCIATE_TAG

const tokenRes = await fetch("https://api.amazon.co.uk/auth/o2/token", {
  method:  "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    grant_type:    "client_credentials",
    client_id:     clientId,
    client_secret: clientSecret,
    scope:         "creatorsapi::default",
  }),
})
const tokenData = await tokenRes.json()
if (!tokenRes.ok) { console.error("Token error:", tokenData); process.exit(1) }
console.log("Token OK. Testing search…\n")

const token = tokenData.access_token

const searchRes = await fetch("https://creatorsapi.amazon/catalog/v1/searchItems", {
  method:  "POST",
  headers: {
    "Content-Type":  "application/json",
    "Authorization": `Bearer ${token}`,
    "x-marketplace": "www.amazon.in",
  },
  body: JSON.stringify({
    keywords:    "smartphones deals",
    itemCount:   3,
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

const data = await searchRes.json()
console.log("Search status:", searchRes.status)
if (!searchRes.ok) {
  console.error(JSON.stringify(data, null, 2))
  process.exit(1)
}

const items = data?.searchResult?.items ?? []
console.log(`Found ${items.length} items\n`)
for (const item of items) {
  const listing   = item?.offersV2?.listings?.[0]
  const salePrice = listing?.price?.amount ?? 0
  console.log(`  ASIN: ${item.asin}  |  ${item?.itemInfo?.title?.displayValue?.slice(0, 60)}  |  ₹${salePrice}`)
}
