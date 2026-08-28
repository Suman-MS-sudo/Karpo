import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json()
    if (!email || typeof email !== "string" || !code || typeof code !== "string" || !newPassword || typeof newPassword !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
    }

    const normalized = email.trim().toLowerCase()
    const identifier = `reset:${normalized}`

    const token = await prisma.verificationToken.findFirst({
      where: { identifier, token: code, expires: { gt: new Date() } },
    })
    if (!token) {
      return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 })
    }

    const passwordHash = await hashPassword(newPassword)
    await Promise.all([
      prisma.user.update({ where: { email: normalized }, data: { passwordHash } }),
      prisma.verificationToken.deleteMany({ where: { identifier } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[reset-password]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
