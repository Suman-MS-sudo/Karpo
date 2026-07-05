/**
 * Add workEmail column to User table on Turso (idempotent).
 * Run: node scripts/migrate-user-workemail-column.mjs
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
  await db.execute(`ALTER TABLE User ADD COLUMN workEmail TEXT`)
  console.log("  ✓ Added column: workEmail")
} catch (e) {
  if (e.message?.includes("duplicate column name") || e.message?.includes("already exists")) {
    console.log("  ⚠ Column already exists: workEmail")
  } else {
    console.error(`  ✗ Failed workEmail: ${e.message}`)
    process.exit(1)
  }
}

try {
  await db.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "User_workEmail_key" ON "User"("workEmail")`)
  console.log("  ✓ Unique index created")
} catch (e) {
  console.log(`  ⚠ Index: ${e.message}`)
}

console.log("\nDone.")
