import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const request = await prisma.companyRequest.findUnique({ where: { id: params.id } })
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Create or update company
  const company = await prisma.company.upsert({
    where: { domain: request.domain },
    update: { isApproved: true },
    create: { name: request.name, domain: request.domain, city: request.city, isApproved: true },
  })

  // Update request status
  await prisma.companyRequest.update({ where: { id: params.id }, data: { status: "APPROVED" } })

  // Verify all users with this domain
  await prisma.user.updateMany({
    where: { email: { endsWith: `@${request.domain}` } },
    data: { companyId: company.id, isVerified: true },
  })

  return NextResponse.json({ success: true, company })
}
