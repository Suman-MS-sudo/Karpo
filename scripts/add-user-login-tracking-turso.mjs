/**
 * Adds User.lastLoginAt / User.loginCount columns — additive, safe to re-run.
 *
 * Run: node --env-file=.env.local scripts/add-user-login-tracking-turso.mjs
 */

import { createClient } from "@libsql/client"

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const stmts = [
  `ALTER TABLE User ADD COLUMN lastLoginAt DATETIME`,
  `ALTER TABLE User ADD COLUMN loginCount INTEGER NOT NULL DEFAULT 0`,
]

for (const sql of stmts) {
  try {
    await db.execute(sql)
    console.log("OK:", sql)
  } catch (e) {
    console.log("SKIP:", e.message.split("\n")[0])
  }
}

db.close()
console.log("Done.")
