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
  const deals = await prisma.deal.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { redemptions: true } } },
  })
  return NextResponse.json(deals)
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const {
    title, description, discount, code, validFrom, validUntil,
    category, merchantName, merchantUrl, companyLogo, terms,
    usageLimit, redemptionSteps, featured, trending, badge, source,
  } = body

  if (!title || !description || !discount || !validUntil || !merchantName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const deal = await prisma.deal.create({
    data: {
      title,
      description,
      discount:        Number(discount),
      code:            code || null,
      validFrom:       validFrom  ? new Date(validFrom)  : null,
      validUntil:      new Date(validUntil),
      category:        category ?? "OTHER",
      merchantName,
      merchantUrl:     merchantUrl  || null,
      companyLogo:     companyLogo  || null,
      terms:           terms        || null,
      redemptionSteps: redemptionSteps || null,
      usageLimit:      usageLimit ? Number(usageLimit) : null,
      images:          "[]",
      isActive:        true,
      featured:        !!featured,
      trending:        !!trending,
      badge:           badge  || null,
      source:          source || "MANUAL",
      lastUpdated:     new Date(),
    },
  })

  return NextResponse.json(deal, { status: 201 })
}
