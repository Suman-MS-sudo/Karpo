/**
 * One-time cleanup script — run with: npx tsx scripts/cleanup-db.ts
 * Removes the bad @gmail.com "company" record created during admin account setup.
 */
import { prisma } from "../lib/prisma"

async function main() {
  // Delete the gmail.com company that was auto-created when the admin signed up
  const deleted = await prisma.company.deleteMany({
    where: { domain: "gmail.com" },
  })
  console.log(`Deleted ${deleted.count} gmail.com company record(s)`)

  // Show remaining companies
  const companies = await prisma.company.findMany({ select: { name: true, domain: true, isApproved: true } })
  console.log("Remaining companies:", companies)
}

main().catch(console.error).finally(() => prisma.$disconnect())
