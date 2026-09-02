"use client"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { formatRelativeTime, truncate } from "@/lib/utils"
import { WishlistButton } from "./WishlistButton"
import type { WishlistItemType } from "@/lib/wishlist"

export interface WishlistItem {
  itemType: WishlistItemType
  itemId: string
  href: string
  title: string
  subtitle?: string
  priceLabel?: string
  image?: string | null
  typeLabel: string
  savedAt: Date | string
}

// Compact, unified card for the /wishlist page — items span several post
// types (Marketplace, Rentals, Referrals…) with very different shapes, so
// this deliberately doesn't try to match each type's own bespoke card.
export function WishlistItemCard({ item }: { item: WishlistItem }) {
  return (
    <div className="group relative bg-card rounded-xl border border-border hover:shadow-md transition-all duration-200 overflow-hidden">
      <Link href={item.href} className="absolute inset-0 z-0" aria-label={item.title} />
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        {item.image ? (
          <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-3xl">📦</div>
        )}
        <div className="absolute top-2 right-2">
          <WishlistButton itemId={item.itemId} itemType={item.itemType} initialWishlisted />
        </div>
      </div>
      <div className="p-4">
        <div className="mb-2">
          <Badge variant="secondary">{item.typeLabel}</Badge>
        </div>
        <h3 className="font-semibold text-foreground group-hover:text-accent-400 transition-colors line-clamp-1">
          {item.title}
        </h3>
        {item.subtitle && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{truncate(item.subtitle, 90)}</p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          {item.priceLabel && <p className="text-sm font-bold text-primary-600">{item.priceLabel}</p>}
          <p className="text-[10px] text-muted-foreground ml-auto">Saved {formatRelativeTime(item.savedAt)}</p>
        </div>
      </div>
    </div>
  )
}
