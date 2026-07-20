import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"
import { sendOTPEmail } from "@/lib/email"
import { normalizePhone } from "@/lib/phone"
import { randomInt } from "crypto"

export async function POST(req: Request) {
  try {
  const { email, phone: rawPhone } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const normalized = email.trim().toLowerCase()
  const phone = typeof rawPhone === "string" && rawPhone.trim() ? normalizePhone(rawPhone) : undefined

  // ── Admin bypass — whitelisted email skips corporate domain check ──────────
  // These accounts always get an automatic OTP (auto-filled client-side, no
  // real email needed) regardless of ADMIN_EMAIL/DEV_EMAILS env config.
  const AUTO_OTP_ADMIN_EMAILS = [
    "testckb@korpo.com",
  ]
  const adminEmails = (process.env.ADMIN_EMAIL ?? "").split(",").map(e => e.trim().toLowerCase())
  const isAdmin = adminEmails.includes(normalized) || AUTO_OTP_ADMIN_EMAILS.includes(normalized)

  // ── Dev/test emails — get auto-OTP returned in response ──────────────────
  const devEmails = (process.env.DEV_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean)
  const isDevEmail = isAdmin || devEmails.includes(normalized)

  // ── Domain validation ──────────────────────────────────────────────────────
  const { blocked, reason } = isAdmin ? { blocked: false, reason: undefined } : isDomainBlocked(normalized)
  if (blocked) {
    const message =
      reason === "personal"
        ? "Personal email providers (Gmail, Yahoo, Outlook, etc.) are not allowed. Please use your corporate email."
        : reason === "temp"
        ? "Temporary or disposable email addresses are not allowed."
        : "Please enter a valid corporate email address."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // ── Rate limit: max 3 OTPs per email in 10 minutes ─────────────────────────
  // Tokens are stamped with a 5-minute expiry, so a token whose expiry falls within
  // the last 10 minutes was created within the last ~15 minutes — comfortably covers
  // the request window without needing a separate createdAt column.
  const since = new Date(Date.now() - 10 * 60 * 1000)
  const recentCount = await prisma.verificationToken.count({
    where: { identifier: normalized, expires: { gt: since } },
  })
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Too many requests. Please wait 10 minutes before requesting a new code." },
      { status: 429 }
    )
  }

  // ── Block OTP login while an org ID card verification is outstanding ───────
  // Once approved, the request's email now has a real User row (created by the
  // approve route) so this lookup no longer blocks it.
  if (!isAdmin) {
    const idRequest = await prisma.idVerificationRequest.findUnique({ where: { corpEmail: normalized } })
    if (idRequest && idRequest.status !== "APPROVED") {
      const message =
        idRequest.status === "REJECTED"
          ? "Your ID card verification was rejected. Please resubmit for review."
          : "Your ID card verification is still pending admin approval."
      return NextResponse.json({ error: message }, { status: 403 })
    }
  }

  // ── Check if new or existing user ─────────────────────────────────────────
  const existingUser = await prisma.user.findUnique({ where: { email: normalized } })

  // `phone` is only present when this call comes from the registration form
  // (send-otp is also used bare, with just an email, for OTP resend) — so it
  // doubles as a signal that this must be a brand-new account.
  if (phone) {
    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered. Please sign in instead." },
        { status: 409 }
      )
    }
    const phoneOwner = await prisma.user.findUnique({ where: { phone }, select: { id: true } })
    if (phoneOwner) {
      return NextResponse.json(
        { error: "This phone number is already registered. Please sign in instead." },
        { status: 409 }
      )
    }
  }

  // ── Generate & store OTP ───────────────────────────────────────────────────
  const otp = String(randomInt(100000, 999999))
  const expires = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes — single-use, consumed on first successful verify

  // Delete any previous tokens for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: normalized } })

  await prisma.verificationToken.create({
    data: { identifier: normalized, token: otp, expires },
  })

  // ── Send OTP email ─────────────────────────────────────────────────────────
  const { success, error } = await sendOTPEmail({
    to: normalized,
    otp,
    isNewUser: !existingUser,
  })

  if (!success) {
    return NextResponse.json({ error: error ?? "Failed to send code" }, { status: 500 })
  }

  return NextResponse.json({
    isNewUser: !existingUser,
    ...(isDevEmail ? { devOtp: otp } : {}),
  })
  } catch (err) {
    console.error("[send-otp]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
