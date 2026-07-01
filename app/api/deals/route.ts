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
  const search      = searchParams.get("search")?.trim() ?? ""
  const since       = searchParams.get("since")
  const featuredOnly = searchParams.get("featured") === "1"
  const trendingOnly = searchParams.get("trending") === "1"

  const baseWhere: Record<string, unknown> = {
    isActive:  true,
    validUntil: { gte: new Date() },
  }
  if (category)    baseWhere.category = category
  if (minDiscount) baseWhere.discount = { gte: minDiscount }
  if (featuredOnly) baseWhere.featured = true
  if (trendingOnly) baseWhere.trending = true
  if (search) {
    baseWhere.OR = [
      { title:        { contains: search } },
      { description:  { contains: search } },
      { merchantName: { contains: search } },
    ]
  }

  const orderBy =
    sortBy === "newest"   ? [{ createdAt: "desc"    as const }] :
    sortBy === "expiring" ? [{ validUntil: "asc"    as const }] :
    sortBy === "popular"  ? [{ viewCount:  "desc"   as const }, { usedCount: "desc" as const }] :
                            [{ discount:   "desc"   as const }, { createdAt: "desc" as const }]

  const [deals, newCount] = await Promise.all([
    prisma.deal.findMany({ where: baseWhere as any, orderBy, take: 100 }),
    since
      ? prisma.deal.count({ where: { ...(baseWhere as any), createdAt: { gt: new Date(since) } } })
      : Promise.resolve(0),
  ])

  return NextResponse.json({
    deals,
    newCount,
    total: deals.length,
    fetchedAt: new Date().toISOString(),
  })
}
