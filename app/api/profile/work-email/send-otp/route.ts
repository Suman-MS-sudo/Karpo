import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"
import { sendOTPEmail } from "@/lib/email"
import { randomInt } from "crypto"

// Prefixing keeps this OTP's VerificationToken row from colliding with the
// unrelated sign-in OTP that might be in flight for the same email address.
function tokenIdentifier(userId: string, email: string) {
  return `reverify-work-email:${userId}:${email}`
}

// Lets an already logged-in user re-verify a (new) work email — e.g. after
// switching companies — by proving mailbox ownership via OTP.
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

  const identifier = tokenIdentifier(session.user.id, normalized)

  const since = new Date(Date.now() - 10 * 60 * 1000)
  const recentCount = await prisma.verificationToken.count({
    where: { identifier, expires: { gt: since } },
  })
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Too many requests. Please wait 10 minutes before requesting a new code." },
      { status: 429 }
    )
  }

  const otp = String(randomInt(100000, 999999))
  const expires = new Date(Date.now() + 5 * 60 * 1000)

  await prisma.verificationToken.deleteMany({ where: { identifier } })
  await prisma.verificationToken.create({ data: { identifier, token: otp, expires } })

  const { success, error: sendError } = await sendOTPEmail({ to: normalized, otp, isNewUser: false })
  if (!success) {
    return NextResponse.json({ error: sendError ?? "Failed to send code" }, { status: 500 })
  }

  const devEmails = (process.env.DEV_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  const isDevEmail = devEmails.includes(normalized)

  return NextResponse.json({ ok: true, ...(isDevEmail ? { devOtp: otp } : {}) })
}
