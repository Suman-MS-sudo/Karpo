/**
 * Create the ContentReport table on Turso (idempotent).
 * Run: node scripts/migrate-create-contentreport-table.mjs
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

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

const statements = [
  `CREATE TABLE IF NOT EXISTS "ContentReport" (
    "id"        TEXT NOT NULL PRIMARY KEY,
    "itemType"  TEXT NOT NULL,
    "itemId"    TEXT NOT NULL,
    "userId"    TEXT NOT NULL,
    "reason"    TEXT NOT NULL,
    "details"   TEXT,
    "status"    TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ContentReport_itemType_itemId_userId_key" ON "ContentReport"("itemType","itemId","userId")`,
  `CREATE INDEX IF NOT EXISTS "ContentReport_status_idx" ON "ContentReport"("status")`,
]

for (const sql of statements) {
  try {
    await db.execute(sql)
    console.log("  ✓", sql.split("\n")[0].slice(0, 80))
  } catch (e) {
    console.error(`  ✗ Failed: ${e.message}`)
    process.exit(1)
  }
}
console.log("\nDone.")
