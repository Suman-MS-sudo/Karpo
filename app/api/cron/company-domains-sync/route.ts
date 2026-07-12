/**
 * POST /api/cron/company-domains-sync
 *
 * Runs daily (see vercel.json). Two jobs:
 *  1. Re-upserts the curated COMPANY_DOMAINS list (lib/company-domains.js) as
 *     pre-approved companies — idempotent, so editing that file is enough to
 *     get new entries live without a manual script run.
 *  2. Emails the admin a digest of any CompanyRequest rows still PENDING, so
 *     real signups from companies not on the curated list get reviewed
 *     regularly instead of sitting unnoticed in /admin/companies.
 *
 * Protected by Authorization: Bearer <CRON_SECRET>
 */
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/email"
import { COMPANY_DOMAINS } from "@/lib/company-domains"

export async function POST(req: Request) {
  const authHeader      = req.headers.get("Authorization") ?? ""
  const vercelCronToken = req.headers.get("x-vercel-cron-token") ?? ""
  const cronSecret      = process.env.CRON_SECRET ?? ""

  const isVercelCron = vercelCronToken !== ""
  const isBearerAuth = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isVercelCron && !isBearerAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // ── Job 1: sync curated domain list ────────────────────────────────────────
  let inserted = 0
  for (const [name, domain] of COMPANY_DOMAINS) {
    const existing = await prisma.company.findUnique({ where: { domain }, select: { id: true } })
    if (existing) continue
    await prisma.company.create({ data: { name, domain, isApproved: true } })
    inserted++
  }

  // ── Job 2: admin digest of pending review requests ─────────────────────────
  const pending = await prisma.companyRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
  })

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").split(",")[0]?.trim()
  if (adminEmail && pending.length > 0) {
    const rows = pending
      .map((r) => `<tr><td style="padding:6px 12px">${r.name}</td><td style="padding:6px 12px">${r.domain}</td><td style="padding:6px 12px">${r.requestedBy}</td></tr>`)
      .join("")
    try {
      await sendEmail({
        to: adminEmail,
        subject: `Korpo: ${pending.length} company request${pending.length === 1 ? "" : "s"} awaiting review`,
        html: `
          <p>${pending.length} company domain request${pending.length === 1 ? " is" : "s are"} still pending approval.</p>
          <table style="border-collapse:collapse">
            <tr><th style="text-align:left;padding:6px 12px">Company</th><th style="text-align:left;padding:6px 12px">Domain</th><th style="text-align:left;padding:6px 12px">Requested by</th></tr>
            ${rows}
          </table>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/companies">Review in the admin panel →</a></p>
        `,
      })
    } catch (err) {
      console.error("[company-domains-sync] admin digest email failed:", err)
    }
  }

  return NextResponse.json({ newlyApprovedDomains: inserted, pendingReview: pending.length })
}

// Vercel Cron issues GET requests; allow admins to trigger manually too
export async function GET(req: Request) {
  return POST(req)
}
