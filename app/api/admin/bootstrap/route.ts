import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// One-time bootstrap route — DELETE this file after use.
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (!secret || secret !== process.env.BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const email = req.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ error: "email query param is required" }, { status: 400 })
  }

  const user = await prisma.user.upsert({
    where:  { email },
    update: { role: "ADMIN" },
    create: {
      email,
      role: "ADMIN",
      isVerified: true,
    },
    select: { id: true, email: true, name: true, role: true },
  })

  return NextResponse.json({ ok: true, user })
}
