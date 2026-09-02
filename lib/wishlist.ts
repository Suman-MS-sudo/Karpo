import { prisma } from "@/lib/prisma"

// Shared config for the cross-app Wishlist feature — one entry per
// wishlistable post type. Used by the /api/wishlist route (to know which
// table to validate/read from) and the /wishlist page (to know how to link
// to and label each saved item).
export const WISHLIST_ITEM_TYPES = [
  "LISTING", "RENTAL", "REFERRAL", "CARPOOL", "SKILL", "DEAL", "EVENT", "COURSE",
] as const

export type WishlistItemType = typeof WISHLIST_ITEM_TYPES[number]

export function isWishlistItemType(v: unknown): v is WishlistItemType {
  return typeof v === "string" && (WISHLIST_ITEM_TYPES as readonly string[]).includes(v)
}

export const WISHLIST_TYPE_META: Record<WishlistItemType, { label: string; hrefBase: string }> = {
  LISTING:  { label: "Marketplace", hrefBase: "/marketplace" },
  RENTAL:   { label: "Rentals",     hrefBase: "/rentals" },
  REFERRAL: { label: "Referrals",   hrefBase: "/referrals" },
  CARPOOL:  { label: "Carpool",     hrefBase: "/carpool" },
  SKILL:    { label: "Skills",      hrefBase: "/skills" },
  DEAL:     { label: "Deals",       hrefBase: "/deals" },
  EVENT:    { label: "Events",      hrefBase: "/events" },
  COURSE:   { label: "Learning",    hrefBase: "/learning" },
}

// Server-side helper: the set of itemIds a user has wishlisted for a given
// type, for painting hearts as filled on a listing page. Empty set for a
// signed-out user rather than querying with an undefined userId.
export async function getWishlistedIds(userId: string | undefined | null, itemType: WishlistItemType): Promise<Set<string>> {
  if (!userId) return new Set()
  const rows = await prisma.wishlist.findMany({ where: { userId, itemType }, select: { itemId: true } })
  return new Set(rows.map((r) => r.itemId))
}
