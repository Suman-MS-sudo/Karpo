/**
 * Create the Wishlist table on Turso (idempotent).
 * Run: node scripts/migrate-create-wishlist-table.mjs
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

try {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "Wishlist" (
      "id"        TEXT NOT NULL PRIMARY KEY,
      "userId"    TEXT NOT NULL,
      "itemType"  TEXT NOT NULL DEFAULT 'LISTING',
      "listingId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Wishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Wishlist_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  console.log("  ✓ Created table: Wishlist")
} catch (e) {
  console.error(`  ✗ Failed: ${e.message}`)
  process.exit(1)
}

try {
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "Wishlist_userId_itemType_listingId_key" ON "Wishlist"("userId", "itemType", "listingId")`)
  console.log("  ✓ Created unique index: Wishlist_userId_itemType_listingId_key")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

try {
  await db.execute(`CREATE INDEX IF NOT EXISTS "Wishlist_userId_idx" ON "Wishlist"("userId")`)
  console.log("  ✓ Created index: Wishlist_userId_idx")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

try {
  await db.execute(`CREATE INDEX IF NOT EXISTS "Wishlist_listingId_idx" ON "Wishlist"("listingId")`)
  console.log("  ✓ Created index: Wishlist_listingId_idx")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

console.log("\nDone.")
