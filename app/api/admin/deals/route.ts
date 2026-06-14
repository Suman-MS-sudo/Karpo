import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function requireAdmin() {
  const session = await auth()
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (session.user?.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error
  const deals = await prisma.deal.findMany({ orderBy: { createdAt: "desc" } })
  return NextResponse.json(deals)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const { title, description, discount, code, validUntil, category, merchantName,
          merchantUrl, terms, usageLimit, redemptionSteps } = body

  if (!title || !description || !discount || !validUntil || !merchantName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const deal = await prisma.deal.create({
    data: {
      merchantId:      "admin",
      title,
      description,
      discount:        Number(discount),
      code:            code || null,
      validUntil:      new Date(validUntil),
      category:        category ?? "OTHER",
      merchantName:    merchantName,
      merchantUrl:     merchantUrl || null,
      terms:           terms || null,
      redemptionSteps: redemptionSteps || null,
      usageLimit:      usageLimit ? Number(usageLimit) : null,
      images:          [],
      isActive:        true,
    },
  })

  return NextResponse.json(deal, { status: 201 })
}
