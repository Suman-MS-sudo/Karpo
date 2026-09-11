/**
 * Add the `scope` column to UserBlock on Turso (idempotent).
 * Run: node scripts/migrate-add-userblock-scope.mjs
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
  await db.execute(`ALTER TABLE "UserBlock" ADD COLUMN "scope" TEXT NOT NULL DEFAULT 'MESSAGE'`)
  console.log("  ✓ Added column: UserBlock.scope")
} catch (e) {
  if (/duplicate column/i.test(e.message)) {
    console.log("  ✓ Column already exists: UserBlock.scope")
  } else {
    console.error(`  ✗ Failed: ${e.message}`)
    process.exit(1)
  }
}

console.log("\nDone.")
