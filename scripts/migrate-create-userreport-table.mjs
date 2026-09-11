/**
 * Create the UserReport table on Turso (idempotent).
 * Run: node scripts/migrate-create-userreport-table.mjs
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
    CREATE TABLE IF NOT EXISTS "UserReport" (
      "id"         TEXT NOT NULL PRIMARY KEY,
      "reporterId" TEXT NOT NULL,
      "reportedId" TEXT NOT NULL,
      "reason"     TEXT NOT NULL,
      "details"    TEXT,
      "status"     TEXT NOT NULL DEFAULT 'PENDING',
      "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "UserReport_reportedId_fkey" FOREIGN KEY ("reportedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  console.log("  ✓ Created table: UserReport")
} catch (e) {
  console.error(`  ✗ Failed: ${e.message}`)
  process.exit(1)
}

try {
  await db.execute(`CREATE INDEX IF NOT EXISTS "UserReport_reportedId_idx" ON "UserReport"("reportedId")`)
  console.log("  ✓ Created index: UserReport_reportedId_idx")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

try {
  await db.execute(`CREATE INDEX IF NOT EXISTS "UserReport_status_idx" ON "UserReport"("status")`)
  console.log("  ✓ Created index: UserReport_status_idx")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

console.log("\nDone.")
