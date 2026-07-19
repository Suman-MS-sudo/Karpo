/**
 * Create the AppGrievance table on Turso (idempotent).
 * Run: node scripts/migrate-create-appgrievance-table.mjs
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
    CREATE TABLE IF NOT EXISTS "AppGrievance" (
      "id"        TEXT NOT NULL PRIMARY KEY,
      "userId"    TEXT NOT NULL,
      "category"  TEXT NOT NULL,
      "message"   TEXT NOT NULL,
      "status"    TEXT NOT NULL DEFAULT 'OPEN',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "AppGrievance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  console.log("  ✓ Created table: AppGrievance")
} catch (e) {
  console.error(`  ✗ Failed: ${e.message}`)
  process.exit(1)
}

try {
  await db.execute(`CREATE INDEX IF NOT EXISTS "AppGrievance_status_idx" ON "AppGrievance"("status")`)
  console.log("  ✓ Created index: AppGrievance_status_idx")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

console.log("\nDone.")
