/**
 * Add personalEmail column to User table on Turso (idempotent, additive).
 * Run this BEFORE deploying code that reads/writes User.personalEmail.
 * Run: node --env-file=.env.local scripts/migrate-user-personalemail-column.mjs
 */
import { createClient } from "@libsql/client"

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

try {
  await db.execute(`ALTER TABLE User ADD COLUMN personalEmail TEXT`)
  console.log("  ✓ Added column: personalEmail")
} catch (e) {
  if (e.message?.includes("duplicate column name") || e.message?.includes("already exists")) {
    console.log("  ⚠ Column already exists: personalEmail")
  } else {
    console.error(`  ✗ Failed personalEmail: ${e.message}`)
    process.exit(1)
  }
}

console.log("\nDone.")
