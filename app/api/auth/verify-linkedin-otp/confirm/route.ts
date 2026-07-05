import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { otp } = await req.json()
  if (!otp || typeof otp !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 })
  }

  const email = session.user.email
  if (!email) {
    return NextResponse.json({ error: "No email on account" }, { status: 400 })
  }

  const token = await prisma.verificationToken.findFirst({
    where: { identifier: email, token: otp, expires: { gt: new Date() } },
  })
  if (!token) {
    return NextResponse.json({ error: "Invalid or expired code. Please try again." }, { status: 400 })
  }

  await prisma.verificationToken.deleteMany({ where: { identifier: email } })
  await prisma.user.update({ where: { id: session.user.id }, data: { isVerified: true } })

  return NextResponse.json({ ok: true })
}
