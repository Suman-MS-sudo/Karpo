/**
 * Apply schema SQL to Turso and migrate data from local SQLite.
 * Run: node scripts/push-schema-to-turso.mjs
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env.local
const envLines = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8').split('\n')
for (const line of envLines) {
  if (!line.trim() || line.trim().startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  let val = line.slice(idx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
  if (!process.env[key]) process.env[key] = val
}

const TURSO_URL   = process.env.TURSO_DATABASE_URL
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN
const LOCAL_URL   = 'file:./prisma/dev.db'

if (!TURSO_URL || !TURSO_URL.startsWith('libsql://')) {
  console.error('TURSO_DATABASE_URL must be a libsql:// URL in .env.local')
  process.exit(1)
}

const turso = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })
const local = createClient({ url: LOCAL_URL })

// ── Step 1: Apply schema SQL ──────────────────────────────────────────────────
console.log('Step 1: Applying schema to Turso...')
const schemaSQL = readFileSync(resolve(process.cwd(), 'scripts/schema.sql'), 'utf-8')

// Each statement spans multiple lines and ends with ");" or ";"
// Split by looking for the semicolon at the END of a block (before a blank line or EOF)
const rawStatements = schemaSQL
  .replace(/--[^\n]*/g, '')       // strip SQL comments
  .split(/;\s*(?:\r?\n\s*\r?\n|$)/)  // split on ; followed by blank line or EOF
  .map(s => s.trim())
  .filter(s => s.length > 0)

let applied = 0
for (const stmt of rawStatements) {
  const sql = stmt + ';'
  try {
    await turso.execute(sql)
    applied++
  } catch (err) {
    if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
      // skip silently
    } else {
      console.warn(`  ⚠ ${err.message.slice(0, 100)}`)
    }
  }
}
console.log(`  ✓ ${applied} statements applied\n`)

// ── Step 2: Migrate data from local SQLite ────────────────────────────────────
console.log('Step 2: Migrating data from local SQLite to Turso...')

const TABLES = [
  'Company','CompanyRequest','VerificationToken','User','Account','Session',
  'Membership','Notification','Message','Review','Payment',
  'Listing','ListingOffer','ListingReport','ListingEngagement',
  'RentalPost','RentalInquiry','JobReferral','ReferralApplication',
  'CarpoolRoute','CarpoolRequest','ServicePost',
  'Deal','DealRedemption','Event','EventRsvp','Course','CourseEnrollment',
  'ConciergeLead','BenefitProduct','SkillListing','SkillOrder','SkillReview',
]

await turso.execute('PRAGMA foreign_keys = OFF')

let totalRows = 0
for (const table of TABLES) {
  const result = await local.execute(`SELECT * FROM "${table}"`)
  const rows = result.rows
  if (!rows.length) { console.log(`  ${table.padEnd(24)} (empty)`); continue }

  const cols = result.columns
  const colsSql = cols.map(c => `"${c}"`).join(', ')
  const placeholders = cols.map(() => '?').join(', ')
  const sql = `INSERT OR IGNORE INTO "${table}" (${colsSql}) VALUES (${placeholders})`

  // Insert in batches of 50
  const BATCH = 50
  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    await turso.batch(
      chunk.map(row => ({ sql, args: cols.map(c => row[c] ?? null) })),
      'write'
    )
  }
  totalRows += rows.length
  console.log(`  ${table.padEnd(24)} ✓ ${rows.length} rows`)
}

await turso.execute('PRAGMA foreign_keys = ON')
await turso.close()
await local.close()

console.log(`\n✅ Done! ${totalRows} rows pushed to Turso (${TURSO_URL})\n`)
