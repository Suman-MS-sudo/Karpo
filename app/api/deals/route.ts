import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const { error } = await requireVerified()
  if (error) return error

  const { searchParams } = req.nextUrl
  const category    = searchParams.get("category") ?? ""
  const minDiscount = parseInt(searchParams.get("minDiscount") ?? "0")
  const sortBy      = searchParams.get("sortBy") ?? "discount"
  const since       = searchParams.get("since") // ISO timestamp — for new-deal detection

  const baseWhere = {
    isActive: true,
    validUntil: { gte: new Date() },
    ...(category    ? { category }                      : {}),
    ...(minDiscount ? { discount: { gte: minDiscount } } : {}),
  }

  const orderBy =
    sortBy === "newest"   ? [{ createdAt: "desc" as const }] :
    sortBy === "expiring" ? [{ validUntil: "asc"  as const }] :
                            [{ discount: "desc" as const }, { createdAt: "desc" as const }]

  const [deals, newCount] = await Promise.all([
    prisma.deal.findMany({ where: baseWhere, orderBy, take: 60 }),
    since
      ? prisma.deal.count({
          where: { ...baseWhere, createdAt: { gt: new Date(since) } },
        })
      : Promise.resolve(0),
  ])

  return NextResponse.json({
    deals,
    newCount,
    total: deals.length,
    fetchedAt: new Date().toISOString(),
  })
}
