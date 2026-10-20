/**
 * Legal-compliance schema additions on Turso (idempotent, additive):
 *  - User.termsVersion / User.termsAcceptedAt   (click-wrap acceptance evidence)
 *  - CookieConsentLog table                     (cookie-consent evidence)
 *  - DeletedUserArchive table                   (180-day post-deletion retention)
 * Run this BEFORE deploying code that reads/writes these.
 * Run: node --env-file=.env.local scripts/migrate-legal-compliance.mjs
 */
import { createClient } from "@libsql/client"

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })

for (const [col, type] of [["termsVersion", "TEXT"], ["termsAcceptedAt", "DATETIME"]]) {
  try {
    await db.execute(`ALTER TABLE User ADD COLUMN ${col} ${type}`)
    console.log(`  ✓ Added column: User.${col}`)
  } catch (e) {
    if (e.message?.includes("duplicate column name") || e.message?.includes("already exists")) {
      console.log(`  ⚠ Column already exists: User.${col}`)
    } else {
      console.error(`  ✗ Failed User.${col}: ${e.message}`)
      process.exit(1)
    }
  }
}

const statements = [
  `CREATE TABLE IF NOT EXISTS "CookieConsentLog" (
    "id"         TEXT NOT NULL PRIMARY KEY,
    "consentId"  TEXT NOT NULL,
    "userId"     TEXT,
    "version"    TEXT NOT NULL,
    "functional" BOOLEAN NOT NULL,
    "userAgent"  TEXT,
    "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "CookieConsentLog_consentId_idx" ON "CookieConsentLog"("consentId")`,
  `CREATE TABLE IF NOT EXISTS "DeletedUserArchive" (
    "id"          TEXT NOT NULL PRIMARY KEY,
    "userId"      TEXT NOT NULL,
    "email"       TEXT,
    "data"        TEXT NOT NULL,
    "deletedById" TEXT,
    "deletedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "purgeAfter"  DATETIME NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "DeletedUserArchive_purgeAfter_idx" ON "DeletedUserArchive"("purgeAfter")`,
  `CREATE INDEX IF NOT EXISTS "DeletedUserArchive_userId_idx" ON "DeletedUserArchive"("userId")`,
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
