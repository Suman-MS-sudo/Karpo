import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  const body = await req.json()
  const request = await prisma.companyRequest.create({
    data: {
      name: body.name,
      domain: body.domain,
      city: body.city,
      requestedBy: body.requestedBy,
    },
  })
  return NextResponse.json(request, { status: 201 })
}
