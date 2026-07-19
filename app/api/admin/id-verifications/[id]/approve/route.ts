import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendIdVerificationApprovedEmail } from "@/lib/email"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const request = await prisma.idVerificationRequest.findUnique({ where: { id: params.id } })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const domain = request.corpEmail.split("@")[1]
  const company = await prisma.company.findFirst({ where: { domain, isApproved: true } })

  if (request.requestType === "REVERIFICATION" && request.userId) {
    // Existing user proving a new employer via ID card — only their work
    // email/company change, login identity (User.email) is untouched.
    try {
      await prisma.user.update({
        where: { id: request.userId },
        data: {
          workEmail: request.corpEmail,
          ...(company ? { companyId: company.id } : {}),
        },
      })
    } catch (err: unknown) {
      // Unique-constraint race: this email got claimed by another account
      // between submission and approval.
      if (typeof err === "object" && err !== null && "code" in err && err.code === "P2002") {
        return NextResponse.json({ error: "This work email is already linked to another account." }, { status: 409 })
      }
      throw err
    }

    // No approved company for this domain yet — flag it for admin follow-up,
    // same as the self-serve OTP re-verification path.
    if (!company) {
      const existingRequest = await prisma.companyRequest.findFirst({ where: { domain } })
      if (!existingRequest) {
        await prisma.companyRequest.create({
          data: {
            name: domain.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            domain,
            requestedBy: request.corpEmail,
            status: "PENDING",
          },
        })
      }
    }
  } else {
    // The password the applicant chose at submission time (see
    // /api/id-verification) becomes their login password the moment they're
    // approved — no separate email/link step needed.
    await prisma.user.upsert({
      where: { email: request.corpEmail },
      update: {
        isVerified: true,
        phone: request.phone,
        passwordHash: request.passwordHash,
        ...(company ? { companyId: company.id } : {}),
      },
      create: {
        email: request.corpEmail,
        name: request.fullName,
        phone: request.phone,
        jobTitle: request.designation,
        isVerified: true,
        role: "USER",
        passwordHash: request.passwordHash,
        ...(company ? { companyId: company.id } : {}),
        membership: { create: { plan: "FREE" } },
      },
    })
  }

  await prisma.idVerificationRequest.update({
    where: { id: params.id },
    data: { status: "APPROVED", reviewedAt: new Date() },
  })

  await sendIdVerificationApprovedEmail(request.corpEmail)

  return NextResponse.redirect(new URL("/admin/id-verifications", req.url), 303)
}
