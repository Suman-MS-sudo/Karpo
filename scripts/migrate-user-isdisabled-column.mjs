/**
 * Add isDisabled column to User table on Turso (idempotent).
 * Run: node scripts/migrate-user-isdisabled-column.mjs
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
  await db.execute(`ALTER TABLE User ADD COLUMN isDisabled BOOLEAN NOT NULL DEFAULT false`)
  console.log("  ✓ Added column: isDisabled")
} catch (e) {
  if (e.message?.includes("duplicate column name") || e.message?.includes("already exists")) {
    console.log("  ⚠ Column already exists: isDisabled")
  } else {
    console.error(`  ✗ Failed isDisabled: ${e.message}`)
    process.exit(1)
  }
}

console.log("\nDone.")
