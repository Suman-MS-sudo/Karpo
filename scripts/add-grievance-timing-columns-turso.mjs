/**
 * Adds AppGrievance.respondedAt / AppGrievance.resolvedAt columns — additive,
 * safe to re-run. Powers the admin Concerns page's response/resolution timing.
 *
 * Run: node --env-file=.env.local scripts/add-grievance-timing-columns-turso.mjs
 */

import { createClient } from "@libsql/client"

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const stmts = [
  `ALTER TABLE AppGrievance ADD COLUMN respondedAt DATETIME`,
  `ALTER TABLE AppGrievance ADD COLUMN resolvedAt DATETIME`,
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
