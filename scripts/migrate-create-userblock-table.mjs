/**
 * Create the UserBlock table on Turso (idempotent).
 * Run: node scripts/migrate-create-userblock-table.mjs
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
    CREATE TABLE IF NOT EXISTS "UserBlock" (
      "id"        TEXT NOT NULL PRIMARY KEY,
      "blockerId" TEXT NOT NULL,
      "blockedId" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "UserBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  console.log("  ✓ Created table: UserBlock")
} catch (e) {
  console.error(`  ✗ Failed: ${e.message}`)
  process.exit(1)
}

try {
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "UserBlock_blockerId_blockedId_key" ON "UserBlock"("blockerId", "blockedId")`)
  console.log("  ✓ Created unique index: UserBlock_blockerId_blockedId_key")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

try {
  await db.execute(`CREATE INDEX IF NOT EXISTS "UserBlock_blockedId_idx" ON "UserBlock"("blockedId")`)
  console.log("  ✓ Created index: UserBlock_blockedId_idx")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

console.log("\nDone.")
