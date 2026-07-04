/**
 * One-time migration: copy images still hosted on Supabase Storage into
 * Cloudinary, then rewrite the DB rows (Turso) to point at the new URLs.
 * Run: node scripts/migrate-images-to-cloudinary.mjs
 */
import { createClient as createLibSQL } from '@libsql/client'
import { v2 as cloudinary } from 'cloudinary'
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

const TURSO_URL   = process.env.TURSO_DATABASE_URL
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN
if (!TURSO_URL || !TURSO_TOKEN) { console.error('Missing Turso credentials'); process.exit(1) }

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})
if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary credentials'); process.exit(1)
}

const db = createLibSQL({ url: TURSO_URL, authToken: TURSO_TOKEN })

const SUPABASE_MARKER = 'supabase.co/storage'

// table -> single-value string fields that may hold a Supabase URL
const STRING_FIELDS = {
  User: ['avatarUrl', 'image'],
}
// table -> JSON-array-as-string fields that may hold Supabase URLs
const ARRAY_FIELDS = {
  Listing: ['images'],
  RentalPost: ['images'],
  ServicePost: ['portfolio'],
  Deal: ['images'],
  Event: ['images'],
  Course: ['images'],
}

const urlCache = new Map() // supabase url -> cloudinary url

async function migrateUrl(url) {
  if (urlCache.has(url)) return urlCache.get(url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'image/jpeg'
  const dataUri = `data:${contentType};base64,${buffer.toString('base64')}`
  const result = await cloudinary.uploader.upload(dataUri, { folder: 'korpo/migrated' })
  urlCache.set(url, result.secure_url)
  console.log(`  ${url}\n  -> ${result.secure_url}`)
  return result.secure_url
}

let rowsUpdated = 0
let urlsMigrated = 0

for (const [table, fields] of Object.entries(STRING_FIELDS)) {
  for (const field of fields) {
    const { rows } = await db.execute(
      `SELECT id, "${field}" as val FROM "${table}" WHERE "${field}" LIKE '%${SUPABASE_MARKER}%'`
    )
    for (const row of rows) {
      const newUrl = await migrateUrl(row.val)
      await db.execute({
        sql: `UPDATE "${table}" SET "${field}" = ? WHERE id = ?`,
        args: [newUrl, row.id],
      })
      rowsUpdated++
      urlsMigrated++
    }
  }
}

for (const [table, fields] of Object.entries(ARRAY_FIELDS)) {
  for (const field of fields) {
    const { rows } = await db.execute(
      `SELECT id, "${field}" as val FROM "${table}" WHERE "${field}" LIKE '%${SUPABASE_MARKER}%'`
    )
    for (const row of rows) {
      let arr
      try { arr = JSON.parse(row.val) } catch { continue }
      if (!Array.isArray(arr)) continue

      let changed = false
      const newArr = []
      for (const item of arr) {
        if (typeof item === 'string' && item.includes(SUPABASE_MARKER)) {
          newArr.push(await migrateUrl(item))
          changed = true
          urlsMigrated++
        } else {
          newArr.push(item)
        }
      }
      if (changed) {
        await db.execute({
          sql: `UPDATE "${table}" SET "${field}" = ? WHERE id = ?`,
          args: [JSON.stringify(newArr), row.id],
        })
        rowsUpdated++
      }
    }
  }
}

console.log(`\nDone. Rows updated: ${rowsUpdated}, URLs migrated: ${urlsMigrated}`)
