/**
 * Fixes datetime format in Deal rows inserted by reset-and-seed-deals.mjs.
 * Converts "2026-07-02 15:15:44" → "2026-07-02T15:15:44.000Z" for all datetime cols.
 *
 * Run: node --env-file=.env.local scripts/fix-deal-datetimes-turso.mjs
 */

import { createClient } from "@libsql/client"

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Fetch all deals
const { rows } = await db.execute("SELECT id, lastUpdated, createdAt, updatedAt, validFrom, validUntil FROM Deal")
console.log(`Found ${rows.length} deals to fix\n`)

function toISO(val) {
  if (!val) return null
  if (typeof val === "string" && val.includes("T")) return val  // already ISO
  // "2026-07-02 15:15:44" → "2026-07-02T15:15:44.000Z"
  return new Date(val.replace(" ", "T") + (val.includes("Z") ? "" : "Z")).toISOString()
}

let fixed = 0
for (const row of rows) {
  const lastUpdated = toISO(row[1])
  const createdAt   = toISO(row[2])
  const updatedAt   = toISO(row[3])
  const validFrom   = toISO(row[4])
  const validUntil  = toISO(row[5])

  await db.execute({
    sql: `UPDATE Deal SET
      lastUpdated = ?,
      createdAt   = ?,
      updatedAt   = ?,
      validFrom   = ?,
      validUntil  = ?
    WHERE id = ?`,
    args: [lastUpdated, createdAt, updatedAt, validFrom, validUntil, row[0]],
  })
  fixed++
  process.stdout.write(`\r  Fixed ${fixed}/${rows.length}`)
}

console.log(`\n\nDone. ${fixed} rows updated.`)
process.exit(0)
