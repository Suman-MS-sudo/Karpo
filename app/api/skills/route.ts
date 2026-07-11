import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireVerified } from "@/lib/api-auth"

export async function GET(req: NextRequest) {
  const { error } = await requireVerified()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const q          = searchParams.get("q")         ?? ""
  const category   = searchParams.get("category")  ?? ""
  const format     = searchParams.get("format")    ?? ""
  const minPrice   = searchParams.get("minPrice")
  const maxPrice   = searchParams.get("maxPrice")
  const minRating  = searchParams.get("minRating")
  const sort       = searchParams.get("sort")      ?? "featured"
  const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"))
  const PAGE       = 20

  const where: any = { status: "ACTIVE" }
  if (q)        where.OR = [{ title: { contains: q } }, { tagline: { contains: q } }, { description: { contains: q } }]
  if (category) where.category = category
  if (format)   where.format = format
  if (minRating) where.avgRating = { gte: parseFloat(minRating) }

  // Price filter: any package at or above/below threshold
  // We filter post-query for package price since packages is Json
  const orderBy: any = sort === "price_asc"    ? { hourlyRate: "asc" }
                     : sort === "price_desc"   ? { hourlyRate: "desc" }
                     : sort === "rating"       ? { avgRating: "desc" }
                     : sort === "popular"      ? { totalOrders: "desc" }
                     : sort === "newest"       ? { createdAt: "desc" }
                     : [{ isFeatured: "desc" }, { avgRating: "desc" }]

  const [listings, total] = await Promise.all([
    prisma.skillListing.findMany({
      where,
      orderBy,
      skip:    (page - 1) * PAGE,
      take:    PAGE,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, image: true, jobTitle: true, department: true, isVerified: true, company: { select: { name: true, logo: true } } } },
        _count: { select: { orders: true, reviews: true } },
      },
    }),
    prisma.skillListing.count({ where }),
  ])

  return NextResponse.json({ listings, total, page, pages: Math.ceil(total / PAGE) })
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireVerified()
  if (error) return error

  const body = await req.json()
  const { title, tagline, category, subcategory, skills, description, deliverables, requirements, faqs,
          pricingModel, hourlyRate, packages, format, location, timezone, availability, maxClientsPerMonth,
          yearsExp, certifications, portfolioUrl, linkedIn } = body

  if (!title || !category || !description || !format) {
    return NextResponse.json({ error: "title, category, description, format are required" }, { status: 400 })
  }

  const isPremium = session.user.membershipPlan === "PREMIUM"
  const listing = await prisma.skillListing.create({
    data: {
      userId:            session.user.id,
      title,
      tagline:           tagline           || null,
      category,
      subcategory:       subcategory       || null,
      skills:            Array.isArray(skills) ? skills : [],
      description,
      deliverables:      Array.isArray(deliverables) ? deliverables : [],
      requirements:      requirements      || null,
      faqs:              Array.isArray(faqs) ? faqs : [],
      pricingModel:      pricingModel      || "PACKAGE",
      hourlyRate:        hourlyRate        ? Number(hourlyRate)  : null,
      packages:          Array.isArray(packages) ? packages : [],
      format,
      location:          location          || null,
      timezone:          timezone          || "Asia/Kolkata",
      availability:      availability      ?? null,
      maxClientsPerMonth: maxClientsPerMonth ? Number(maxClientsPerMonth) : null,
      yearsExp:          yearsExp          ? Number(yearsExp)   : null,
      certifications:    Array.isArray(certifications) ? certifications : [],
      portfolioUrl:      portfolioUrl      || null,
      linkedIn:          linkedIn          || null,
      isFeatured:        isPremium,
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
