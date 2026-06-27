/**
 * One-time migration: Supabase PostgreSQL → local SQLite (via @libsql/client)
 * Run after `prisma db push`:  node scripts/migrate-to-sqlite.mjs
 */
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient as createLibSQL } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Load .env.local ──────────────────────────────────────────────────────────
const envPath = resolve(process.cwd(), '.env.local')
const envLines = readFileSync(envPath, 'utf-8').split('\n')
for (const line of envLines) {
  if (!line.trim() || line.trim().startsWith('#')) continue
  const idx = line.indexOf('=')
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  let val = line.slice(idx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1)
  }
  if (!process.env[key]) process.env[key] = val
}

const SUPABASE_URL     = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SVC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SQLITE_URL       = process.env.TURSO_DATABASE_URL ?? 'file:./prisma/dev.db'

if (!SUPABASE_URL || !SUPABASE_SVC_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ── Clients ──────────────────────────────────────────────────────────────────
const supabase = createSupabase(SUPABASE_URL, SUPABASE_SVC_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const sqlite = createLibSQL({ url: SQLITE_URL })

// ── Field maps (same as lib/prisma.ts) ───────────────────────────────────────
const ARRAY_FIELDS = {
  User:          ['hiddenServices', 'skills'],
  Listing:       ['images'],
  RentalPost:    ['amenities', 'images', 'furnishingItems'],
  JobReferral:   ['skills', 'perks'],
  CarpoolRoute:  ['pickupPoints'],
  ServicePost:   ['portfolio'],
  Deal:          ['images'],
  Event:         ['images', 'tags'],
  Course:        ['images', 'tags'],
  SkillListing:  ['skills', 'deliverables', 'certifications'],
  SkillOrder:    ['attachments', 'deliverables'],
  BenefitProduct:['features', 'applicationSteps'],
}

const JSON_FIELDS = {
  User:         ['socialLinks'],
  CarpoolRoute: ['stopCoords'],
  SkillListing: ['faqs', 'packages', 'availability'],
  Event:        ['agenda'],
  Course:       ['curriculum'],
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function processRow(model, row) {
  const arrayFs = ARRAY_FIELDS[model] ?? []
  const jsonFs  = JSON_FIELDS[model]  ?? []
  const out = {}
  for (const [key, val] of Object.entries(row)) {
    if (arrayFs.includes(key)) {
      // PG arrays arrive as JS arrays from the REST API; stringify for SQLite
      out[key] = val == null ? '[]' : (typeof val === 'string' ? val : JSON.stringify(val))
    } else if (jsonFs.includes(key)) {
      out[key] = val == null ? null : (typeof val === 'string' ? val : JSON.stringify(val))
    } else if (typeof val === 'boolean') {
      out[key] = val ? 1 : 0
    } else {
      out[key] = val
    }
  }
  return out
}

async function fetchAll(table) {
  // Supabase JS client uses the table name exactly as given
  const { data, error } = await supabase.from(table).select('*').limit(10000)
  if (error) {
    if (error.code === '42P01') return []   // table does not exist
    throw new Error(`${table}: ${error.message}`)
  }
  return data ?? []
}

async function insertRows(model, rows) {
  if (!rows.length) return 0

  const processed = rows.map(r => processRow(model, r))
  const cols = Object.keys(processed[0])
  const colsSql = cols.map(c => `"${c}"`).join(', ')
  const placeholders = cols.map(() => '?').join(', ')
  const sql = `INSERT OR IGNORE INTO "${model}" (${colsSql}) VALUES (${placeholders})`

  const BATCH = 50
  for (let i = 0; i < processed.length; i += BATCH) {
    const chunk = processed.slice(i, i + BATCH)
    await sqlite.batch(
      chunk.map(row => ({ sql, args: cols.map(c => row[c] ?? null) })),
      'write',
    )
  }
  return processed.length
}

// ── Migration order (respects FK dependencies) ────────────────────────────────
const TABLES = [
  'Company',
  'CompanyRequest',
  'VerificationToken',
  'User',
  'Account',
  'Session',
  'Membership',
  'Notification',
  'Message',
  'Review',
  'Payment',
  'Listing',
  'ListingOffer',
  'ListingReport',
  'ListingEngagement',
  'RentalPost',
  'RentalInquiry',
  'JobReferral',
  'ReferralApplication',
  'CarpoolRoute',
  'CarpoolRequest',
  'ServicePost',
  'Deal',
  'DealRedemption',
  'Event',
  'EventRsvp',
  'Course',
  'CourseEnrollment',
  'ConciergeLead',
  'BenefitProduct',
  'SkillListing',
  'SkillOrder',
  'SkillReview',
]

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Supabase PostgreSQL → SQLite migration')
  console.log(`  Source : ${SUPABASE_URL}`)
  console.log(`  Target : ${SQLITE_URL}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Disable FK enforcement so we can insert in any order safely
  await sqlite.execute('PRAGMA foreign_keys = OFF')

  let totalRows = 0
  for (const table of TABLES) {
    process.stdout.write(`  ${table.padEnd(24)} `)
    try {
      const rows = await fetchAll(table)
      if (!rows.length) {
        console.log('(empty)')
        continue
      }
      const n = await insertRows(table, rows)
      totalRows += n
      console.log(`✓ ${n} rows`)
    } catch (err) {
      console.log(`✗ ${err.message}`)
    }
  }

  await sqlite.execute('PRAGMA foreign_keys = ON')
  await sqlite.close()

  console.log(`\n✅  Done! ${totalRows} rows migrated to ${SQLITE_URL}\n`)
}

main().catch(err => {
  console.error('\n✗ Migration failed:', err.message)
  process.exit(1)
})
