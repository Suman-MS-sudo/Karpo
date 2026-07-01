import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"
import { sendOTPEmail } from "@/lib/email"
import { randomInt } from "crypto"

export async function POST(req: Request) {
  try {
  const { email } = await req.json()

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 })
  }

  const normalized = email.trim().toLowerCase()

  // ── Admin bypass — whitelisted email skips corporate domain check ──────────
  const adminEmails = (process.env.ADMIN_EMAIL ?? "").split(",").map(e => e.trim().toLowerCase())
  const isAdmin = adminEmails.includes(normalized)

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

  // ── Rate limit: max 3 OTPs per email in 15 minutes ─────────────────────────
  const since = new Date(Date.now() - 15 * 60 * 1000)
  const recentCount = await prisma.verificationToken.count({
    where: { identifier: normalized, expires: { gt: since } },
  })
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Too many requests. Please wait 15 minutes before requesting a new code." },
      { status: 429 }
    )
  }

  // ── Check if new or existing user ─────────────────────────────────────────
  const existingUser = await prisma.user.findUnique({ where: { email: normalized } })

  // ── Generate & store OTP ───────────────────────────────────────────────────
  const otp = String(randomInt(100000, 999999))
  const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

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
