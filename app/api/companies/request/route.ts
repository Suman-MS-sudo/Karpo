import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"

export async function POST(req: Request) {
  const body = await req.json()
  const domain = (body.domain as string | undefined)?.trim().toLowerCase()

  if (!domain || isDomainBlocked(`user@${domain}`).blocked) {
    return NextResponse.json({ error: "Please provide a valid corporate domain." }, { status: 400 })
  }

  const existing = await prisma.companyRequest.findFirst({ where: { domain } })
  if (existing) {
    return NextResponse.json(existing, { status: 200 })
  }

  const request = await prisma.companyRequest.create({
    data: {
      name: body.name,
      domain,
      city: body.city,
      requestedBy: body.requestedBy,
    },
  })
  return NextResponse.json(request, { status: 201 })
}
