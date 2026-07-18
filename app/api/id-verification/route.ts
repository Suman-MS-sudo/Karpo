import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"
import { hashPassword } from "@/lib/password"
import { normalizePhone } from "@/lib/phone"

// Submitted before the user has an account — this is the alternate path for
// proving corporate employment via an org ID card instead of domain/OTP match.
// Login stays blocked until an admin approves the resulting request (see auth.ts).
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 })

  const corpEmail = (body.corpEmail as string | undefined)?.trim().toLowerCase()
  const phone = (body.phone as string | undefined)?.trim() ? normalizePhone(body.phone as string) : undefined
  const fullName = (body.fullName as string | undefined)?.trim()
  const employeeId = (body.employeeId as string | undefined)?.trim() || undefined
  const designation = (body.designation as string | undefined)?.trim() || undefined
  const frontImageUrl = body.frontImageUrl as string | undefined
  const backImageUrl = body.backImageUrl as string | undefined
  const password = body.password as string | undefined

  if (!corpEmail || !phone || !fullName || !frontImageUrl || !backImageUrl || !password) {
    return NextResponse.json({ error: "All required fields must be filled in" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
  }

  const { blocked, reason } = isDomainBlocked(corpEmail)
  if (blocked) {
    const message =
      reason === "personal"
        ? "Personal email providers (Gmail, Yahoo, Outlook, etc.) are not allowed. Please use your corporate email."
        : reason === "temp"
        ? "Temporary or disposable email addresses are not allowed."
        : "Please enter a valid corporate email address."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: corpEmail }, { workEmail: corpEmail }] },
    select: { id: true },
  })
  if (existingUser) {
    return NextResponse.json({ error: "This email is already registered. Please sign in instead." }, { status: 409 })
  }

  const phoneOwner = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
  if (phoneOwner) {
    return NextResponse.json({ error: "This phone number is already registered. Please sign in instead." }, { status: 409 })
  }

  const passwordHash = await hashPassword(password)

  // Upsert so a rejected/pending applicant can correct details and resubmit
  // under the same email without piling up duplicate requests.
  await prisma.idVerificationRequest.upsert({
    where: { corpEmail },
    update: {
      phone, fullName, employeeId, designation, frontImageUrl, backImageUrl, passwordHash,
      status: "PENDING", reviewedAt: null,
    },
    create: {
      corpEmail, phone, fullName, employeeId, designation, frontImageUrl, backImageUrl, passwordHash,
      status: "PENDING",
    },
  })

  return NextResponse.json({ ok: true })
}
