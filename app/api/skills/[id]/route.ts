import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/api-auth"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const listing = await prisma.skillListing.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true, name: true, avatarUrl: true, image: true, bio: true,
          jobTitle: true, department: true, isVerified: true, phone: true,
          company: { select: { name: true, logo: true, domain: true } },
          reviewsReceived: { select: { rating: true }, take: 100 },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: {
          reviewer: { select: { id: true, name: true, avatarUrl: true, image: true, jobTitle: true, isAnonymous: true } as any },
        },
      },
      _count: { select: { orders: true, reviews: true } },
    },
  })

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Increment view count (fire-and-forget)
  if (listing.userId !== session.user.id) {
    prisma.skillListing.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } }).catch(() => {})
  }

  // Attach viewer's existing order if any
  const myOrder = session.user.id !== listing.userId
    ? await prisma.skillOrder.findFirst({
        where: { listingId: params.id, buyerId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : null

  return NextResponse.json({ listing, myOrder })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth()
  if (error) return error

  const listing = await prisma.skillListing.findUnique({ where: { id: params.id }, select: { userId: true } })
  if (!listing || listing.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const allowed = ["title","tagline","category","subcategory","skills","description","deliverables","requirements","faqs",
                   "pricingModel","hourlyRate","packages","format","location","timezone","availability","maxClientsPerMonth",
                   "yearsExp","certifications","portfolioUrl","linkedIn","status"]
  const data: any = {}
  for (const k of allowed) { if (k in body) data[k] = body[k] }

  const updated = await prisma.skillListing.update({ where: { id: params.id }, data })
  return NextResponse.json(updated)
}
