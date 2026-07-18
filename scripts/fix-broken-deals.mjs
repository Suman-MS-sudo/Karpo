/**
 * Removes deals with broken/made-up ASINs and fixes affiliate URLs.
 */

import { createClient } from "@libsql/client"

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Remove specific deals we know are broken (ASIN doesn't exist on Amazon India)
const BROKEN_TITLES = [
  "Michelin Pilot Sport 4 Tyres",          // B08QKGX15R — doesn't exist
  "Vega Crux Helmet (ISI)",                // B07BG3XNJW — India listing uncertain
  "Cello World Opalware Dinner Set",       // Flipkart URL placeholder
  "Redmi 14C (128GB)",                     // Flipkart URL placeholder
  "Noise ColorFit Pro 5 GPS Smartwatch",   // Flipkart URL placeholder
]

console.log("Removing deals with broken/placeholder URLs…")
for (const title of BROKEN_TITLES) {
  const result = await db.execute({
    sql:  "DELETE FROM Deal WHERE title LIKE ?",
    args: [`${title}%`],
  })
  console.log(`  Removed: "${title}"`)
}

// Fix all Amazon affiliate URLs — ensure tag is correct
const tag = process.env.AMAZON_ASSOCIATE_TAG ?? "phoenixcomp0e-21"
const { rows } = await db.execute(
  "SELECT id, affiliateUrl FROM Deal WHERE affiliateNetwork = 'AMAZON'"
)

console.log(`\nFixing affiliate tags on ${rows.length} Amazon deals…`)
let fixed = 0
for (const row of rows) {
  const id  = row[0]
  const url = row[1]
  if (!url || typeof url !== "string") continue
  // Extract ASIN and rebuild clean URL with correct tag
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/)
  if (!asinMatch) continue
  const asin    = asinMatch[1]
  const cleanUrl = `https://www.amazon.in/dp/${asin}?tag=${tag}`
  await db.execute({ sql: "UPDATE Deal SET affiliateUrl = ?, website = ? WHERE id = ?", args: [cleanUrl, cleanUrl, id] })
  fixed++
}
console.log(`  Fixed ${fixed} URLs → https://www.amazon.in/dp/ASIN?tag=${tag}`)

console.log("\nDone.")
process.exit(0)
