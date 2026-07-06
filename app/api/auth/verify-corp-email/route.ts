import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"
import { verifyCorpEmail } from "@/lib/corp-email-verify"

// Captures and validates the corporate email a LinkedIn-originated user
// asserts, without ever sending that address a message (see lib/corp-email-verify.ts).
export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { email } = await req.json()
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }
  const normalized = email.trim().toLowerCase()

  const { blocked, reason } = isDomainBlocked(normalized)
  if (blocked) {
    const message =
      reason === "personal"
        ? "Personal email providers (Gmail, Yahoo, Outlook, etc.) are not allowed. Please use your corporate email."
        : reason === "temp"
        ? "Temporary or disposable email addresses are not allowed."
        : "Please enter a valid corporate email address."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const existingOwner = await prisma.user.findFirst({
    where: { OR: [{ email: normalized }, { workEmail: normalized }], NOT: { id: session.user.id } },
    select: { id: true },
  })
  if (existingOwner) {
    return NextResponse.json({ error: "This email is already linked to another account." }, { status: 409 })
  }

  const check = await verifyCorpEmail(normalized)
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 400 })
  }

  const domain = normalized.split("@")[1]
  const company = await prisma.company.findFirst({ where: { domain, isApproved: true } })

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        workEmail: normalized,
        ...(company ? { companyId: company.id } : {}),
      },
    })
  } catch (err: unknown) {
    // Unique-constraint race: another request claimed this workEmail between our
    // existingOwner check and this update.
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "This email is already linked to another account." }, { status: 409 })
    }
    throw err
  }

  if (!company) {
    const existingRequest = await prisma.companyRequest.findFirst({ where: { domain } })
    if (!existingRequest) {
      await prisma.companyRequest.create({
        data: {
          name: domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          domain,
          requestedBy: normalized,
          status: "PENDING",
        },
      })
    }
  }

  return NextResponse.json({ ok: true, hasCompany: !!company })
}
