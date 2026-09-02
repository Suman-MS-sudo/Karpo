"use client"
import { useState } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WishlistItemType } from "@/lib/wishlist"

interface WishlistButtonProps {
  itemId: string
  itemType?: WishlistItemType
  initialWishlisted?: boolean
  className?: string
  onChange?: (wishlisted: boolean) => void
}

// Heart toggle shown on a post's image, next to the share icon. Optimistic —
// flips immediately, rolls back if the request fails. Works for any
// wishlistable post type (Marketplace, Rentals, Referrals, Carpool, Skills,
// Deals, Events, Learning) — see lib/wishlist.ts.
export function WishlistButton({ itemId, itemType = "LISTING", initialWishlisted = false, className, onChange }: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted)
  const [busy, setBusy] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (busy) return
    setBusy(true)
    const next = !wishlisted
    setWishlisted(next)
    onChange?.(next)
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, itemType }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setWishlisted(!!data.wishlisted)
      onChange?.(!!data.wishlisted)
    } catch {
      setWishlisted(!next)
      onChange?.(!next)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={wishlisted}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "relative z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm transition-transform hover:scale-110",
        className
      )}
    >
      <Heart className={cn("h-3.5 w-3.5 transition-colors", wishlisted ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
    </button>
  )
}
