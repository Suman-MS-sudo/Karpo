/**
 * Appends 'Z' to all ISO datetime strings in Turso that are missing timezone info.
 * Run: node scripts/fix-turso-datetimes.mjs
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'fs'
import { resolve } from 'path'

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

const turso = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// All DateTime columns per table (from prisma/schema.prisma)
const DATETIME_COLS = {
  Account:             [],
  Company:             ['createdAt', 'updatedAt'],
  CompanyRequest:      ['createdAt'],
  User:                ['emailVerified', 'createdAt', 'updatedAt'],
  Session:             ['expires'],
  VerificationToken:   ['expires'],
  Membership:          ['startDate', 'endDate', 'createdAt', 'updatedAt'],
  Notification:        ['createdAt'],
  Message:             ['createdAt'],
  Review:              ['createdAt'],
  Payment:             ['createdAt', 'updatedAt'],
  Listing:             ['boostExpiresAt', 'createdAt', 'updatedAt'],
  ListingOffer:        ['createdAt', 'updatedAt'],
  ListingReport:       ['createdAt'],
  ListingEngagement:   ['visitDate', 'createdAt', 'updatedAt'],
  RentalPost:          ['availableFrom', 'createdAt', 'updatedAt'],
  RentalInquiry:       ['moveInDate', 'visitDate', 'createdAt', 'updatedAt'],
  JobReferral:         ['deadline', 'createdAt', 'updatedAt'],
  ReferralApplication: ['createdAt', 'updatedAt'],
  CarpoolRoute:        ['liveTrackAt', 'createdAt', 'updatedAt'],
  CarpoolRequest:      ['createdAt', 'updatedAt'],
  ServicePost:         ['createdAt', 'updatedAt'],
  Deal:                ['validUntil', 'createdAt', 'updatedAt'],
  DealRedemption:      ['redeemedAt'],
  Event:               ['date', 'createdAt', 'updatedAt'],
  EventRsvp:           ['createdAt'],
  Course:              ['createdAt', 'updatedAt'],
  CourseEnrollment:    ['enrolledAt', 'completedAt'],
  ConciergeLead:       ['createdAt', 'updatedAt'],
  BenefitProduct:      ['createdAt', 'updatedAt'],
  SkillListing:        ['createdAt', 'updatedAt'],
  SkillOrder:          ['sessionDate', 'deliveredAt', 'completedAt', 'cancelledAt', 'disputeOpenedAt', 'resolvedAt', 'createdAt', 'updatedAt'],
  SkillReview:         ['repliedAt', 'createdAt', 'updatedAt'],
}

console.log('Fixing datetime values in Turso (appending Z where missing)...\n')

let totalFixed = 0
for (const [table, cols] of Object.entries(DATETIME_COLS)) {
  if (!cols.length) continue
  let tableFixed = 0
  for (const col of cols) {
    // Append Z to values that look like ISO datetimes but have no timezone marker
    const result = await turso.execute(
      `UPDATE "${table}"
       SET "${col}" = "${col}" || 'Z'
       WHERE "${col}" IS NOT NULL
         AND "${col}" NOT LIKE '%Z'
         AND "${col}" NOT LIKE '%+%'
         AND "${col}" GLOB '????-??-??T??:??:??*'`
    )
    tableFixed += result.rowsAffected ?? 0
  }
  if (tableFixed > 0) {
    console.log(`  ${table.padEnd(24)} fixed ${tableFixed} values`)
    totalFixed += tableFixed
  }
}

await turso.close()
console.log(`\n✅ Done — ${totalFixed} datetime values fixed.\n`)
