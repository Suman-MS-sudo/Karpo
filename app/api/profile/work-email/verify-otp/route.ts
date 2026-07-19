import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"

function tokenIdentifier(userId: string, email: string) {
  return `reverify-work-email:${userId}:${email}`
}

export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { email, otp } = await req.json()
  if (!email || typeof email !== "string" || !otp || typeof otp !== "string") {
    return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
  }
  const normalized = email.trim().toLowerCase()
  const identifier = tokenIdentifier(session.user.id, normalized)

  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token: otp.trim() },
  })
  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "Invalid or expired code." }, { status: 400 })
  }

  const existingOwner = await prisma.user.findFirst({
    where: { OR: [{ email: normalized }, { workEmail: normalized }], NOT: { id: session.user.id } },
    select: { id: true },
  })
  if (existingOwner) {
    await prisma.verificationToken.deleteMany({ where: { identifier } })
    return NextResponse.json({ error: "This email is already linked to another account." }, { status: 409 })
  }

  const domain = normalized.split("@")[1]
  const company = await prisma.company.findFirst({ where: { domain, isApproved: true } })

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        workEmail: normalized,
        companyId: company?.id ?? null,
      },
    })
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "This email is already linked to another account." }, { status: 409 })
    }
    throw err
  }

  await prisma.verificationToken.deleteMany({ where: { identifier } })

  if (!company) {
    const existingRequest = await prisma.companyRequest.findFirst({ where: { domain } })
    if (!existingRequest) {
      await prisma.companyRequest.create({
        data: {
          name: domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          domain,
          requestedBy: normalized,
          status: "PENDING",
        },
      })
    }
  }

  return NextResponse.json({ ok: true, hasCompany: !!company })
}
