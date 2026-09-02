import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isWishlistItemType, type WishlistItemType } from "@/lib/wishlist"

// Existence check per post type — used before creating a wishlist row so we
// never save a dangling reference. Each wishlistable post type lives in its
// own table, so this can't be a single Prisma relation/FK.
async function itemExists(itemType: WishlistItemType, itemId: string): Promise<boolean> {
  switch (itemType) {
    case "LISTING":  return !!(await prisma.listing.findUnique({ where: { id: itemId }, select: { id: true } }))
    case "RENTAL":   return !!(await prisma.rentalPost.findUnique({ where: { id: itemId }, select: { id: true } }))
    case "REFERRAL": return !!(await prisma.jobReferral.findUnique({ where: { id: itemId }, select: { id: true } }))
    case "CARPOOL":  return !!(await prisma.carpoolRoute.findUnique({ where: { id: itemId }, select: { id: true } }))
    case "SKILL":    return !!(await prisma.skillListing.findUnique({ where: { id: itemId }, select: { id: true } }))
    case "DEAL":     return !!(await prisma.deal.findUnique({ where: { id: itemId }, select: { id: true } }))
    case "EVENT":    return !!(await prisma.event.findUnique({ where: { id: itemId }, select: { id: true } }))
    case "COURSE":   return !!(await prisma.course.findUnique({ where: { id: itemId }, select: { id: true } }))
  }
}

// GET /api/wishlist — the current user's wishlisted item ids, grouped by
// type (used to paint hearts as filled on cards).
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const rows = await prisma.wishlist.findMany({
    where: { userId: session.user.id },
    select: { itemType: true, itemId: true },
  })

  const byType: Record<string, string[]> = {}
  for (const r of rows) {
    (byType[r.itemType] ??= []).push(r.itemId)
  }
  return NextResponse.json({ itemsByType: byType })
}

// POST /api/wishlist { itemId, itemType } — toggles the item in/out of the
// user's wishlist. Returns the resulting state.
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const itemId = body?.itemId
  const itemType = body?.itemType ?? "LISTING"
  if (!itemId || typeof itemId !== "string") {
    return NextResponse.json({ error: "itemId is required" }, { status: 400 })
  }
  if (!isWishlistItemType(itemType)) {
    return NextResponse.json({ error: "Invalid itemType" }, { status: 400 })
  }

  const existing = await prisma.wishlist.findUnique({
    where: { userId_itemType_itemId: { userId: session.user.id, itemType, itemId } },
  })

  if (existing) {
    await prisma.wishlist.delete({ where: { id: existing.id } })
    return NextResponse.json({ wishlisted: false })
  }

  if (!(await itemExists(itemType, itemId))) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 })
  }

  await prisma.wishlist.create({
    data: { userId: session.user.id, itemType, itemId },
  })
  return NextResponse.json({ wishlisted: true })
}
