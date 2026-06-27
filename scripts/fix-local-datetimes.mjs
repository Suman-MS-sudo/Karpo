import { createClient } from '@libsql/client'

const db = createClient({ url: 'file:./prisma/dev.db' })

const DATETIME_COLS = {
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

let total = 0
for (const [table, cols] of Object.entries(DATETIME_COLS)) {
  for (const col of cols) {
    const r = await db.execute(
      `UPDATE "${table}" SET "${col}" = "${col}" || 'Z'
       WHERE "${col}" IS NOT NULL AND "${col}" NOT LIKE '%Z' AND "${col}" NOT LIKE '%+%'
         AND "${col}" GLOB '????-??-??T??:??:??*'`
    )
    total += r.rowsAffected ?? 0
  }
}
await db.close()
console.log(`✅ Local SQLite: ${total} datetime values fixed.`)
