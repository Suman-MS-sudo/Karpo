import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

async function requireAdmin() {
  const session = await auth()
  if (!session) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  if (session.user?.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  return { session }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error

  const body = await req.json()
  const {
    title, description, discount, code, validFrom, validUntil, category,
    merchantName, merchantUrl, companyLogo, terms, usageLimit,
    redemptionSteps, isActive, featured, trending, badge, source,
  } = body

  const data: Record<string, unknown> = {}
  if (title       !== undefined) data.title       = title
  if (description !== undefined) data.description = description
  if (discount    !== undefined) data.discount    = Number(discount)
  if (code        !== undefined) data.code        = code || null
  if (validFrom   !== undefined) data.validFrom   = validFrom ? new Date(validFrom) : null
  if (validUntil  !== undefined) data.validUntil  = new Date(validUntil)
  if (category    !== undefined) data.category    = category
  if (merchantName !== undefined) data.merchantName = merchantName
  if (merchantUrl !== undefined) data.merchantUrl = merchantUrl || null
  if (companyLogo !== undefined) data.companyLogo = companyLogo || null
  if (terms       !== undefined) data.terms       = terms || null
  if (redemptionSteps !== undefined) data.redemptionSteps = redemptionSteps || null
  if (usageLimit  !== undefined) data.usageLimit  = usageLimit ? Number(usageLimit) : null
  if (typeof isActive  === "boolean") data.isActive  = isActive
  if (typeof featured  === "boolean") data.featured  = featured
  if (typeof trending  === "boolean") data.trending  = trending
  if (badge       !== undefined) data.badge       = badge || null
  if (source      !== undefined) data.source      = source || "MANUAL"
  data.lastUpdated = new Date()

  const deal = await prisma.deal.update({ where: { id: params.id }, data })
  return NextResponse.json(deal)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error
  await prisma.deal.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
