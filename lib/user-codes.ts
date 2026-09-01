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
  // The read-then-write below isn't atomic, so two registrations landing at
  // the same moment (e.g. a duplicate/retried sign-up request) can compute
  // the same next sequence number — whichever writes second hits the unique
  // constraint on userCode/referralCode. That happens *after* the user row
  // itself was already created, so retrying here (rather than letting it
  // throw) avoids failing the whole sign-in over an already-successful
  // account creation.
  //
  // The next sequence is derived from the *highest* userCode ever assigned,
  // not a row count — a count regresses whenever an earlier user is deleted,
  // which would hand out an already-taken code, exhaust every retry, and
  // leave the new user with no userCode/referralCode at all.
  for (let attempt = 0; attempt < 5; attempt++) {
    const last = await prisma.user.findFirst({
      where:   { userCode: { not: null } },
      orderBy: { userCode: "desc" },
      select:  { userCode: true },
    })
    const lastSequence = last?.userCode ? parseInt(last.userCode.slice(2), 10) || 0 : 0
    const nextSequence = lastSequence + 1 + attempt
    const isFirstBatch = nextSequence <= FIRST_BATCH_SIZE

    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          userCode: formatUserCode(nextSequence),
          ...(isFirstBatch
            ? { batchCode: FIRST_BATCH_CODE, referralCode: formatReferralCode(nextSequence) }
            : {}),
        },
      })
      return
    } catch (err: any) {
      if (err?.code === "P2002" && attempt < 4) continue
      throw err
    }
  }
}
