import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { hashPassword } from "@/lib/password"

export async function POST(req: Request) {
  const { password, email, token } = await req.json()
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 })
  }

  const passwordHash = await hashPassword(password)

  // ID-card-approved users have no session yet — they arrive via the one-time
  // link emailed in the approve route instead of an authenticated request.
  if (email && token) {
    const normalized = (email as string).trim().toLowerCase()
    const verification = await prisma.verificationToken.findFirst({
      where: { identifier: normalized, token, expires: { gt: new Date() } },
    })
    if (!verification) {
      return NextResponse.json({ error: "This link is invalid or has expired. Ask an admin to re-approve your request." }, { status: 400 })
    }
    await prisma.verificationToken.deleteMany({ where: { identifier: normalized } })
    await prisma.user.update({ where: { email: normalized }, data: { passwordHash } })
    return NextResponse.json({ ok: true })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash } })
  return NextResponse.json({ ok: true })
}
