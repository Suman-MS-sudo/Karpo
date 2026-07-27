import { prisma } from "@/lib/prisma"

const GRACE_MS = 15 * 60 * 1000

/**
 * One-time carpool postings should disappear 15 minutes after their scheduled
 * departure — lazily swept before every active-route read since there's no
 * background cron in this app.
 */
export async function expireOneTimeCarpoolRoutes() {
  await prisma.carpoolRoute.updateMany({
    where: {
      isActive:    true,
      frequency:   "ONCE",
      departureAt: { lt: new Date(Date.now() - GRACE_MS) },
    },
    data: { isActive: false },
  })
}
