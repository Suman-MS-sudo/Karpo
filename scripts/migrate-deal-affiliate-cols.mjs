/**
 * Adds affiliate columns to the Deal table in Turso (libSQL).
 * Run once: node scripts/migrate-deal-affiliate-cols.mjs
 */

import { createClient } from "@libsql/client"
const url   = process.env.TURSO_DATABASE_URL
const token = process.env.TURSO_AUTH_TOKEN

if (!url || !token) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in env")
  process.exit(1)
}

const client = createClient({ url, authToken: token })

const columns = [
  "ALTER TABLE Deal ADD COLUMN affiliateUrl     TEXT",
  "ALTER TABLE Deal ADD COLUMN affiliateNetwork TEXT",
  "ALTER TABLE Deal ADD COLUMN externalId       TEXT",
  "ALTER TABLE Deal ADD COLUMN originalPrice    REAL",
  "ALTER TABLE Deal ADD COLUMN salePrice        REAL",
  "CREATE INDEX IF NOT EXISTS Deal_externalId_idx ON Deal (externalId)",
]

for (const sql of columns) {
  try {
    await client.execute(sql)
    console.log("OK:", sql.slice(0, 60))
  } catch (err) {
    if (err.message?.includes("duplicate column name")) {
      console.log("SKIP (already exists):", sql.slice(0, 60))
    } else {
      console.error("FAIL:", sql, "\n", err.message)
    }
  }
}

console.log("\nDone.")
process.exit(0)
