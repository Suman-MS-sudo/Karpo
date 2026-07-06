import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

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

  return NextResponse.json({ success: true })
}
