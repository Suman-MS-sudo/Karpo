import { NextResponse } from "next/server"
import { randomInt } from "crypto"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { sendOTPEmail } from "@/lib/email"

// Sends an OTP to the currently signed-in user's own email address, to confirm
// ownership of the inbox LinkedIn reported (LinkedIn allows personal domains
// through, so this closes that trust gap before granting full access).
export async function POST() {
  const { session, error } = await requireAuth()
  if (error) return error

  if (session.user.isVerified) {
    return NextResponse.json({ error: "Already verified" }, { status: 400 })
  }

  const email = session.user.email
  if (!email) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 })
  }

  const since = new Date(Date.now() - 15 * 60 * 1000)
  const recentCount = await prisma.verificationToken.count({
    where: { identifier: email, expires: { gt: since } },
  })
  if (recentCount >= 3) {
    return NextResponse.json(
      { error: "Too many requests. Please wait 15 minutes before requesting a new code." },
      { status: 429 }
    )
  }

  const otp = String(randomInt(100000, 999999))
  const expires = new Date(Date.now() + 10 * 60 * 1000)

  await prisma.verificationToken.deleteMany({ where: { identifier: email } })
  await prisma.verificationToken.create({ data: { identifier: email, token: otp, expires } })

  const { success, error: sendError } = await sendOTPEmail({ to: email, otp, isNewUser: false })
  if (!success) {
    return NextResponse.json({ error: sendError ?? "Failed to send code" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
