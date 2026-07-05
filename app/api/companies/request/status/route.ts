import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const domain = new URL(req.url).searchParams.get("domain")?.trim().toLowerCase()
  if (!domain) return NextResponse.json({ error: "domain is required" }, { status: 400 })

  const request = await prisma.companyRequest.findFirst({ where: { domain } })
  return NextResponse.json({ pending: request?.status === "PENDING" })
}
