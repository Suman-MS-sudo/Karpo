/**
 * Add new columns to Deal table on Turso (idempotent ALTER TABLE statements).
 * Run: node scripts/migrate-deal-columns.mjs
 */
import { createClient } from "@libsql/client"
import { readFileSync } from "fs"
import { resolve } from "path"

const envLines = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8").split("\n")
for (const line of envLines) {
  if (!line.trim() || line.trim().startsWith("#")) continue
  const idx = line.indexOf("=")
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  let val = line.slice(idx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
  if (!process.env[key]) process.env[key] = val
}

const TURSO_URL   = process.env.TURSO_DATABASE_URL
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })

const alterStatements = [
  `ALTER TABLE Deal ADD COLUMN validFrom TEXT`,
  `ALTER TABLE Deal ADD COLUMN companyLogo TEXT`,
  `ALTER TABLE Deal ADD COLUMN viewCount INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Deal ADD COLUMN featured INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Deal ADD COLUMN trending INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Deal ADD COLUMN badge TEXT`,
  `ALTER TABLE Deal ADD COLUMN source TEXT NOT NULL DEFAULT 'MANUAL'`,
  `ALTER TABLE Deal ADD COLUMN lastUpdated TEXT NOT NULL DEFAULT (datetime('now'))`,
]

for (const sql of alterStatements) {
  const col = sql.match(/ADD COLUMN (\w+)/)?.[1]
  try {
    await db.execute(sql)
    console.log(`  ✓ Added column: ${col}`)
  } catch (e) {
    if (e.message?.includes("duplicate column name") || e.message?.includes("already exists")) {
      console.log(`  ⚠ Column already exists: ${col}`)
    } else {
      console.error(`  ✗ Failed ${col}: ${e.message}`)
    }
  }
}

// Create indexes
const indexes = [
  `CREATE INDEX IF NOT EXISTS "Deal_featured_isActive_idx" ON "Deal"("featured","isActive")`,
  `CREATE INDEX IF NOT EXISTS "Deal_trending_isActive_idx" ON "Deal"("trending","isActive")`,
  `CREATE INDEX IF NOT EXISTS "Deal_category_isActive_idx" ON "Deal"("category","isActive")`,
]
for (const sql of indexes) {
  try { await db.execute(sql); console.log(`  ✓ Index created`) }
  catch (e) { console.log(`  ⚠ Index: ${e.message}`) }
}

console.log("\nDone.")
