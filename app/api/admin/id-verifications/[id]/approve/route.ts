import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendPasswordSetupEmail } from "@/lib/email"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const request = await prisma.idVerificationRequest.findUnique({ where: { id: params.id } })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const domain = request.corpEmail.split("@")[1]
  const company = await prisma.company.findFirst({ where: { domain, isApproved: true } })

  await prisma.user.upsert({
    where: { email: request.corpEmail },
    update: {
      isVerified: true,
      phone: request.phone,
      ...(company ? { companyId: company.id } : {}),
    },
    create: {
      email: request.corpEmail,
      name: request.fullName,
      phone: request.phone,
      jobTitle: request.designation,
      isVerified: true,
      role: "USER",
      ...(company ? { companyId: company.id } : {}),
      membership: { create: { plan: "FREE" } },
    },
  })

  await prisma.idVerificationRequest.update({
    where: { id: params.id },
    data: { status: "APPROVED", reviewedAt: new Date() },
  })

  // ID-card-verified users never go through an authenticated session before
  // this point (unlike OTP/LinkedIn), so password setup can't rely on
  // requireAuth() — mail them a one-time token instead.
  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await prisma.verificationToken.deleteMany({ where: { identifier: request.corpEmail } })
  await prisma.verificationToken.create({ data: { identifier: request.corpEmail, token, expires } })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? ""
  const link = `${baseUrl}/auth/set-password?email=${encodeURIComponent(request.corpEmail)}&token=${token}`
  await sendPasswordSetupEmail({ to: request.corpEmail, link })

  return NextResponse.json({ success: true })
}
