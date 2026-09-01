import { prisma } from "@/lib/prisma"

/**
 * Referral posts past their Application Deadline are removed outright (not
 * just closed) — lazily swept before every referral read since there's no
 * background cron in this app. Applications cascade-delete with the post.
 */
export async function deleteExpiredReferrals() {
  await prisma.jobReferral.deleteMany({
    where: { deadline: { lt: new Date() } },
  })
}
