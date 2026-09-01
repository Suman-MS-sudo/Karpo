/**
 * Backfills userCode/referralCode for users left without one — this happened
 * because assignUserCode() used to derive the next sequence from a row COUNT,
 * which regresses whenever an earlier user is deleted, causing collisions
 * that exhausted every retry and silently left userCode/referralCode null.
 * That bug is fixed in lib/user-codes.ts; this script repairs existing rows.
 *
 * Run: & "C:\Program Files\nodejs\node.exe" --env-file=.env.local scripts/backfill-user-codes.mjs
 */

import { PrismaClient } from "@prisma/client"
import { PrismaLibSQL } from "@prisma/adapter-libsql"
import { createClient } from "@libsql/client"

const FIRST_BATCH_SIZE = 100
const FIRST_BATCH_CODE = "0001"

function formatUserCode(sequence)     { return `KP${String(sequence).padStart(5, "0")}` }
function formatReferralCode(sequence) { return `RF${String(sequence).padStart(5, "0")}` }

const libsql  = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const adapter = new PrismaLibSQL(libsql)
const prisma  = new PrismaClient({ adapter })

async function main() {
  const last = await prisma.user.findFirst({
    where:   { userCode: { not: null } },
    orderBy: { userCode: "desc" },
    select:  { userCode: true },
  })
  let sequence = last?.userCode ? parseInt(last.userCode.slice(2), 10) || 0 : 0

  const missing = await prisma.user.findMany({
    where:   { userCode: null },
    orderBy: { createdAt: "asc" },
    select:  { id: true, email: true },
  })

  console.log(`Found ${missing.length} user(s) missing a userCode. Next sequence starts at ${sequence + 1}.`)

  for (const user of missing) {
    sequence += 1
    const isFirstBatch = sequence <= FIRST_BATCH_SIZE
    await prisma.user.update({
      where: { id: user.id },
      data: {
        userCode: formatUserCode(sequence),
        ...(isFirstBatch
          ? { batchCode: FIRST_BATCH_CODE, referralCode: formatReferralCode(sequence) }
          : {}),
      },
    })
    console.log(`  ${user.email ?? user.id} -> ${formatUserCode(sequence)}`)
  }

  console.log("Done.")
}

main().finally(() => prisma.$disconnect())
