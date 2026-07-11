import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(req: Request) {
  const { error } = await requireVerified()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q         = searchParams.get("q")
  const category  = searchParams.get("category")
  const condition = searchParams.get("condition")
  const city      = searchParams.get("city")
  const minPrice  = searchParams.get("minPrice")
  const maxPrice  = searchParams.get("maxPrice")
  const negotiable = searchParams.get("negotiable")
  const sort      = searchParams.get("sort") ?? "newest"
  const limit     = Math.min(parseInt(searchParams.get("limit") ?? "40"), 100)

  const where = {
    status: "ACTIVE",
    ...(q ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] } : {}),
    ...(category  ? { category }  : {}),
    ...(condition ? { condition } : {}),
    ...(city      ? { city }      : {}),
    ...(negotiable ? { isNegotiable: true } : {}),
    ...(minPrice || maxPrice ? {
      price: {
        ...(minPrice ? { gte: parseInt(minPrice) } : {}),
        ...(maxPrice ? { lte: parseInt(maxPrice) } : {}),
      },
    } : {}),
  }

  const sortMap: Record<string, object[]> = {
    price_asc:  [{ price: "asc" }],
    price_desc: [{ price: "desc" }],
    views:      [{ viewCount: "desc" }, { createdAt: "desc" }],
    boosted:    [{ isBoosted: "desc" }, { createdAt: "desc" }],
    newest:     [{ createdAt: "desc" }],
  }
  const orderBy = sortMap[sort] ?? [{ isBoosted: "desc" }, { createdAt: "desc" }]

  const listings = await prisma.listing.findMany({
    where,
    orderBy,
    take: limit,
    include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
  })
  return NextResponse.json({ data: listings })
}

export async function POST(req: Request) {
  const { session, error } = await requireVerified()
  if (error) return error

  // Rate limit: max 5 active listings for free users
  const isPremium = session.user.membershipPlan === "PREMIUM"
  if (!isPremium) {
    const count = await prisma.listing.count({ where: { userId: session.user.id, status: "ACTIVE" } })
    if (count >= 5) {
      return NextResponse.json(
        { error: "Free plan allows max 5 active listings. Upgrade to Premium for unlimited." },
        { status: 429 }
      )
    }
  }

  const body = await req.json()
  const listing = await prisma.listing.create({
    data: {
      userId:       session.user.id,
      title:        body.title,
      description:  body.description,
      price:        body.price,
      category:     body.category,
      subcategory:  body.subcategory || null,
      condition:    body.condition ?? "USED",
      isNegotiable: body.isNegotiable ?? true,
      images:       body.images ?? [],
      city:         body.city,
      latitude:     body.latitude  ?? null,
      longitude:    body.longitude ?? null,
      area:         body.area      ?? null,
      brand:        body.brand     ?? null,
      purchaseYear: body.purchaseYear ?? null,
      warranty:     body.warranty  ?? null,
      meetingPref:  body.meetingPref ?? "BOTH",
      phone:        body.phone     ?? null,
      // Premium users get auto-boost: FEATURED level, 30-day window
      isBoosted:    isPremium,
      boostLevel:   isPremium ? "FEATURED" : "NONE",
      boostExpiresAt: isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
    },
  })
  revalidatePath("/dashboard")
  return NextResponse.json(listing, { status: 201 })
}
