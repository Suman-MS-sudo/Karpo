import { prisma } from "@/lib/prisma"

/**
 * IT (Intermediary Guidelines) Rules, 2021 r.3(1)(h): after an account is
 * cancelled, the information collected at registration must be retained for
 * 180 days. Deleting a User cascades away their posts too, so we snapshot the
 * registration record *and* their content into DeletedUserArchive first, then
 * hard-delete. /api/cron/retention-purge removes archives once purgeAfter passes.
 */
export const DELETED_ACCOUNT_RETENTION_DAYS = 180

export async function archiveAndDeleteUser(userId: string, deletedById?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company:        { select: { name: true, domain: true } },
      accounts:       { select: { provider: true, providerAccountId: true } },
      listings:       true,
      rentalPosts:    true,
      jobReferrals:   true,
      carpoolRoutes:  true,
      skillListings:  true,
      events:         true,
      reportsMade:    true,
      contentReports: true,
      listingReports: true,
    },
  })
  if (!user) return false

  const purgeAfter = new Date(Date.now() + DELETED_ACCOUNT_RETENTION_DAYS * 24 * 60 * 60 * 1000)
  // Never keep the credential itself, even in the archive.
  const snapshot: Partial<typeof user> = { ...user }
  delete snapshot.passwordHash

  await prisma.$transaction([
    prisma.deletedUserArchive.create({
      data: {
        userId:      user.id,
        email:       user.email,
        data:        JSON.stringify(snapshot),
        deletedById: deletedById ?? null,
        purgeAfter,
      },
    }),
    prisma.user.delete({ where: { id: userId } }),
  ])
  return true
}

export async function purgeExpiredArchives() {
  const { count } = await prisma.deletedUserArchive.deleteMany({ where: { purgeAfter: { lt: new Date() } } })
  return count
}
