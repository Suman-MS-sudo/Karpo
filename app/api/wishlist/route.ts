import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

// GET /api/wishlist — the current user's wishlisted listing ids (used to
// paint hearts as filled on cards) or, with ?full=1, the full listing cards
// for the Wishlist dashboard page.
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const full = searchParams.get("full") === "1"

  if (!full) {
    const rows = await prisma.wishlist.findMany({
      where: { userId: session.user.id, itemType: "LISTING" },
      select: { listingId: true },
    })
    return NextResponse.json({ listingIds: rows.map((r) => r.listingId) })
  }

  const rows = await prisma.wishlist.findMany({
    where: { userId: session.user.id, itemType: "LISTING" },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true, title: true, description: true, price: true, images: true,
          category: true, condition: true, isNegotiable: true, city: true,
          status: true, boostLevel: true, viewCount: true, createdAt: true,
          user: {
            select: {
              id: true, name: true, image: true, avatarUrl: true, isVerified: true,
              jobTitle: true, department: true,
            },
          },
        },
      },
    },
  })

  const listings = rows.filter((r) => r.listing).map((r) => r.listing)
  return NextResponse.json({ data: listings })
}

// POST /api/wishlist { listingId } — toggles the listing in/out of the
// user's wishlist. Returns the resulting state.
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const listingId = body?.listingId
  if (!listingId || typeof listingId !== "string") {
    return NextResponse.json({ error: "listingId is required" }, { status: 400 })
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_itemType_listingId: { userId: session.user.id, itemType: "LISTING", listingId } },
  })

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } })
    return NextResponse.json({ wishlisted: false })
  }

  const listing = await prisma.listing.findUnique({ where: { id: listingId }, select: { id: true } })
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })

  await prisma.wishlist.create({
    data: { userId: session.user.id, itemType: "LISTING", listingId },
  })
  return NextResponse.json({ wishlisted: true })
}
