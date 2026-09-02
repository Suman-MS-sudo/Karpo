/**
 * Rework the Wishlist table to support any post type (Marketplace, Rentals,
 * Referrals, Carpool, Skills, Deals, Events, Learning), not just Marketplace
 * listings. Drops the FK to Listing (a wishlisted post can live in any of
 * several tables — no single FK target) and renames listingId -> itemId,
 * itemType is no longer defaulted.
 *
 * Run: node scripts/migrate-wishlist-generalize.mjs
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
    CREATE TABLE IF NOT EXISTS "Wishlist_new" (
      "id"        TEXT NOT NULL PRIMARY KEY,
      "userId"    TEXT NOT NULL,
      "itemType"  TEXT NOT NULL,
      "itemId"    TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Wishlist_new_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  console.log("  ✓ Created table: Wishlist_new")

  await db.execute(`
    INSERT INTO "Wishlist_new" ("id", "userId", "itemType", "itemId", "createdAt")
    SELECT "id", "userId", "itemType", "listingId", "createdAt" FROM "Wishlist"
  `)
  console.log("  ✓ Copied rows from Wishlist -> Wishlist_new")

  await db.execute(`DROP TABLE "Wishlist"`)
  console.log("  ✓ Dropped old Wishlist table")

  await db.execute(`ALTER TABLE "Wishlist_new" RENAME TO "Wishlist"`)
  console.log("  ✓ Renamed Wishlist_new -> Wishlist")
} catch (e) {
  console.error(`  ✗ Failed: ${e.message}`)
  process.exit(1)
}

try {
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "Wishlist_userId_itemType_itemId_key" ON "Wishlist"("userId", "itemType", "itemId")`)
  console.log("  ✓ Created unique index: Wishlist_userId_itemType_itemId_key")
  await db.execute(`CREATE INDEX IF NOT EXISTS "Wishlist_userId_idx" ON "Wishlist"("userId")`)
  console.log("  ✓ Created index: Wishlist_userId_idx")
  await db.execute(`CREATE INDEX IF NOT EXISTS "Wishlist_itemType_itemId_idx" ON "Wishlist"("itemType", "itemId")`)
  console.log("  ✓ Created index: Wishlist_itemType_itemId_idx")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

console.log("\nDone.")
