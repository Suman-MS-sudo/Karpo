/**
 * Upsert the curated COMPANY_DOMAINS list (lib/company-domains.js) as
 * pre-approved companies (idempotent — safe to run repeatedly).
 *
 * Run: node scripts/seed-company-domains.mjs
 * Also invoked on a schedule by app/api/cron/company-domains-sync (vercel.json).
 */
import { createClient } from "@libsql/client"
import { readFileSync } from "fs"
import { resolve } from "path"
import { COMPANY_DOMAINS } from "../lib/company-domains.js"

function loadEnvLocal() {
  try {
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
  } catch {
    // running where env vars are already set (e.g. Vercel Cron)
  }
}

loadEnvLocal()
const TURSO_URL   = process.env.TURSO_DATABASE_URL
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN
if (!TURSO_URL) throw new Error("TURSO_DATABASE_URL is not set")

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })

let inserted = 0
let skipped = 0
for (const [name, domain] of COMPANY_DOMAINS) {
  const existing = await db.execute({ sql: `SELECT id FROM Company WHERE domain = ?`, args: [domain] })
  if (existing.rows.length > 0) { skipped++; continue }

  await db.execute({
    sql: `INSERT INTO Company (id, name, domain, isApproved, createdAt, updatedAt)
          VALUES (lower(hex(randomblob(12))), ?, ?, 1, datetime('now'), datetime('now'))`,
    args: [name, domain],
  })
  inserted++
}

console.log(`✓ Inserted ${inserted} new companies, skipped ${skipped} already present (${COMPANY_DOMAINS.length} total in list)`)
await db.close()
