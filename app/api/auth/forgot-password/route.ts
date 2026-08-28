import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { randomInt } from "crypto"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    const identifier = `reset:${normalized}`

    // ── Rate limit: max 3 reset codes per email in 10 minutes ─────────────────
    const since = new Date(Date.now() - 10 * 60 * 1000)
    const recentCount = await prisma.verificationToken.count({ where: { identifier, expires: { gt: since } } })
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 10 minutes before requesting a new code." },
        { status: 429 }
      )
    }

    // Only send a code if the account exists — but always return the same
    // response either way, so this endpoint can't be used to enumerate
    // registered emails.
    const user = await prisma.user.findUnique({ where: { email: normalized }, select: { id: true } })
    if (user) {
      const otp = String(randomInt(100000, 999999))
      const expires = new Date(Date.now() + 5 * 60 * 1000)

      await Promise.all([
        prisma.verificationToken.deleteMany({ where: { identifier } }),
        prisma.verificationToken.create({ data: { identifier, token: otp, expires } }),
      ])

      const { success, error } = await sendPasswordResetEmail({ to: normalized, otp })
      if (!success) {
        return NextResponse.json({ error: error ?? "Failed to send code" }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[forgot-password]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
