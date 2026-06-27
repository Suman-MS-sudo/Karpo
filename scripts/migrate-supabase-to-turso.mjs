/**
 * Direct migration: Supabase PostgreSQL → Turso (LibSQL)
 * Run: node scripts/migrate-supabase-to-turso.mjs
 */
import { createClient as createSupabase } from '@supabase/supabase-js'
import { createClient as createLibSQL } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ── Load .env.local ──────────────────────────────────────────────────────────
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

// Supabase source (old DB)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Turso target (new DB)
const TURSO_URL   = process.env.TURSO_DATABASE_URL
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN

if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase credentials'); process.exit(1) }
if (!TURSO_URL || !TURSO_TOKEN)     { console.error('Missing Turso credentials');    process.exit(1) }

const supabase = createSupabase(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const turso = createLibSQL({ url: TURSO_URL, authToken: TURSO_TOKEN })

// ── Field maps ───────────────────────────────────────────────────────────────
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

function processRow(model, row) {
  const arrayFs = ARRAY_FIELDS[model] ?? []
  const jsonFs  = JSON_FIELDS[model]  ?? []
  const out = {}
  for (const [key, val] of Object.entries(row)) {
    if (arrayFs.includes(key)) {
      out[key] = val == null ? '[]' : (typeof val === 'string' ? val : JSON.stringify(val))
    } else if (jsonFs.includes(key)) {
      out[key] = val == null ? null : (typeof val === 'string' ? val : JSON.stringify(val))
    } else if (typeof val === 'boolean') {
      out[key] = val ? 1 : 0
    } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(val) && !val.endsWith('Z') && !val.includes('+')) {
      out[key] = val + 'Z'
    } else {
      out[key] = val
    }
  }
  return out
}

async function fetchAll(table) {
  const { data, error } = await supabase.from(table).select('*').limit(10000)
  if (error) {
    if (error.code === '42P01') return []
    throw new Error(error.message)
  }
  return data ?? []
}

async function upsertTable(model) {
  const rows = await fetchAll(model)
  if (!rows.length) return 0

  const processed = rows.map(r => processRow(model, r))
  const cols = Object.keys(processed[0])
  const colsSql = cols.map(c => `"${c}"`).join(', ')
  const placeholders = cols.map(() => '?').join(', ')
  const sql = `INSERT OR REPLACE INTO "${model}" (${colsSql}) VALUES (${placeholders})`

  const BATCH = 50
  for (let i = 0; i < processed.length; i += BATCH) {
    const chunk = processed.slice(i, i + BATCH)
    await turso.batch(
      chunk.map(row => ({ sql, args: cols.map(c => row[c] ?? null) })),
      'write'
    )
  }
  return processed.length
}

// FK-safe insertion order
const TABLES = [
  'Company','CompanyRequest','VerificationToken','User','Account','Session',
  'Membership','Notification','Message','Review','Payment',
  'Listing','ListingOffer','ListingReport','ListingEngagement',
  'RentalPost','RentalInquiry','JobReferral','ReferralApplication',
  'CarpoolRoute','CarpoolRequest','ServicePost',
  'Deal','DealRedemption','Event','EventRsvp','Course','CourseEnrollment',
  'ConciergeLead','BenefitProduct','SkillListing','SkillOrder','SkillReview',
]

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  Supabase PostgreSQL → Turso  (direct)')
  console.log(`  Source : ${SUPABASE_URL}`)
  console.log(`  Target : ${TURSO_URL}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  await turso.execute('PRAGMA foreign_keys = OFF')

  let total = 0
  for (const table of TABLES) {
    process.stdout.write(`  ${table.padEnd(24)} `)
    try {
      const n = await upsertTable(table)
      if (n === 0) { console.log('(empty)') }
      else         { console.log(`✓ ${n} rows`); total += n }
    } catch (err) {
      console.log(`✗ ${err.message}`)
    }
  }

  await turso.execute('PRAGMA foreign_keys = ON')
  await turso.close()

  console.log(`\n✅  Done! ${total} rows in Turso.\n`)
}

main().catch(err => { console.error('Migration failed:', err.message); process.exit(1) })
