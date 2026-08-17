import { prisma } from "@/lib/prisma"

export const FIRST_BATCH_CODE = "0001"
export const FIRST_BATCH_SIZE = 100

export function formatUserCode(sequence: number) {
  return `KP${String(sequence).padStart(5, "0")}`
}

export function formatReferralCode(sequence: number) {
  return `RF${String(sequence).padStart(5, "0")}`
}

/**
 * Assigns the next sequential KP user code to a newly created user, and — for
 * the first 100 signups — a batch code and referral code they can share to
 * invite others (rewards for successful referrals are tracked separately,
 * added later once the batch is extended past 100).
 */
export async function assignUserCode(userId: string) {
  const sequence = await prisma.user.count({ where: { userCode: { not: null } } })
  const nextSequence = sequence + 1

  const isFirstBatch = nextSequence <= FIRST_BATCH_SIZE

  await prisma.user.update({
    where: { id: userId },
    data: {
      userCode: formatUserCode(nextSequence),
      ...(isFirstBatch
        ? { batchCode: FIRST_BATCH_CODE, referralCode: formatReferralCode(nextSequence) }
        : {}),
    },
  })
}
