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
  const { title, description, discount, code, validUntil, category, merchantName,
          merchantUrl, terms, usageLimit, redemptionSteps, isActive } = body

  const data: Record<string, unknown> = {}
  if (title)            data.title            = title
  if (description)      data.description      = description
  if (discount)         data.discount         = Number(discount)
  if (code !== undefined) data.code           = code || null
  if (validUntil)       data.validUntil       = new Date(validUntil)
  if (category)         data.category         = category
  if (merchantName)     data.merchantName     = merchantName
  if (merchantUrl !== undefined) data.merchantUrl = merchantUrl || null
  if (terms !== undefined)       data.terms   = terms || null
  if (redemptionSteps !== undefined) data.redemptionSteps = redemptionSteps || null
  if (usageLimit !== undefined)  data.usageLimit = usageLimit ? Number(usageLimit) : null
  if (typeof isActive === "boolean") data.isActive = isActive

  const deal = await prisma.deal.update({ where: { id: params.id }, data })
  return NextResponse.json(deal)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin()
  if (error) return error
  await prisma.deal.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
