export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Heart, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageTitle } from "@/components/ui/page-title"
import { WishlistItemCard, type WishlistItem } from "@/components/shared/WishlistItemCard"
import { WISHLIST_TYPE_META } from "@/lib/wishlist"
import { parseImages, formatCurrency } from "@/lib/utils"

export const metadata: Metadata = { title: "Wishlist" }

export default async function WishlistPage() {
  const session = await auth()
  const userId  = session!.user!.id

  const rows = await prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })
  const savedAtByKey = new Map(rows.map((r) => [`${r.itemType}:${r.itemId}`, r.createdAt]))
  const idsByType = rows.reduce<Record<string, string[]>>((acc, r) => {
    (acc[r.itemType] ??= []).push(r.itemId)
    return acc
  }, {})

  const items: WishlistItem[] = []

  if (idsByType.LISTING?.length) {
    const rows = await prisma.listing.findMany({
      where: { id: { in: idsByType.LISTING } },
      select: { id: true, title: true, description: true, price: true, images: true, category: true },
    })
    for (const r of rows) items.push({
      itemType: "LISTING", itemId: r.id, href: `/marketplace/${r.id}`,
      title: r.title, subtitle: r.description, priceLabel: formatCurrency(r.price),
      image: parseImages(r.images)[0], typeLabel: WISHLIST_TYPE_META.LISTING.label,
      savedAt: savedAtByKey.get(`LISTING:${r.id}`)!,
    })
  }

  if (idsByType.RENTAL?.length) {
    const rows = await prisma.rentalPost.findMany({
      where: { id: { in: idsByType.RENTAL } },
      select: { id: true, title: true, area: true, city: true, rent: true, images: true },
    })
    for (const r of rows) items.push({
      itemType: "RENTAL", itemId: r.id, href: `/rentals/${r.id}`,
      title: r.title, subtitle: `${r.area}, ${r.city}`, priceLabel: `${formatCurrency(r.rent)}/mo`,
      image: parseImages(r.images)[0], typeLabel: WISHLIST_TYPE_META.RENTAL.label,
      savedAt: savedAtByKey.get(`RENTAL:${r.id}`)!,
    })
  }

  if (idsByType.REFERRAL?.length) {
    const rows = await prisma.jobReferral.findMany({
      where: { id: { in: idsByType.REFERRAL } },
      select: { id: true, title: true, department: true, location: true },
    })
    for (const r of rows) items.push({
      itemType: "REFERRAL", itemId: r.id, href: `/referrals/${r.id}`,
      title: r.title, subtitle: [r.department, r.location].filter(Boolean).join(" · "),
      typeLabel: WISHLIST_TYPE_META.REFERRAL.label,
      savedAt: savedAtByKey.get(`REFERRAL:${r.id}`)!,
    })
  }

  if (idsByType.CARPOOL?.length) {
    const rows = await prisma.carpoolRoute.findMany({
      where: { id: { in: idsByType.CARPOOL } },
      select: { id: true, fromLocation: true, toLocation: true, pricePerSeat: true },
    })
    for (const r of rows) items.push({
      itemType: "CARPOOL", itemId: r.id, href: `/carpool/${r.id}`,
      title: `${r.fromLocation} → ${r.toLocation}`, priceLabel: `${formatCurrency(r.pricePerSeat)}/seat`,
      typeLabel: WISHLIST_TYPE_META.CARPOOL.label,
      savedAt: savedAtByKey.get(`CARPOOL:${r.id}`)!,
    })
  }

  if (idsByType.SKILL?.length) {
    const rows = await prisma.skillListing.findMany({
      where: { id: { in: idsByType.SKILL } },
      select: { id: true, title: true, tagline: true, hourlyRate: true },
    })
    for (const r of rows) items.push({
      itemType: "SKILL", itemId: r.id, href: `/skills/${r.id}`,
      title: r.title, subtitle: r.tagline ?? undefined,
      priceLabel: r.hourlyRate ? `${formatCurrency(r.hourlyRate)}/hr` : undefined,
      typeLabel: WISHLIST_TYPE_META.SKILL.label,
      savedAt: savedAtByKey.get(`SKILL:${r.id}`)!,
    })
  }

  if (idsByType.DEAL?.length) {
    const rows = await prisma.deal.findMany({
      where: { id: { in: idsByType.DEAL } },
      select: { id: true, title: true, description: true, discount: true, images: true },
    })
    for (const r of rows) items.push({
      itemType: "DEAL", itemId: r.id, href: `/deals/${r.id}`,
      title: r.title, subtitle: r.description, priceLabel: `${r.discount}% off`,
      image: parseImages(r.images)[0], typeLabel: WISHLIST_TYPE_META.DEAL.label,
      savedAt: savedAtByKey.get(`DEAL:${r.id}`)!,
    })
  }

  if (idsByType.EVENT?.length) {
    const rows = await prisma.event.findMany({
      where: { id: { in: idsByType.EVENT } },
      select: { id: true, title: true, location: true, fee: true, images: true },
    })
    for (const r of rows) items.push({
      itemType: "EVENT", itemId: r.id, href: `/events/${r.id}`,
      title: r.title, subtitle: r.location, priceLabel: r.fee > 0 ? formatCurrency(r.fee) : "Free",
      image: parseImages(r.images)[0], typeLabel: WISHLIST_TYPE_META.EVENT.label,
      savedAt: savedAtByKey.get(`EVENT:${r.id}`)!,
    })
  }

  if (idsByType.COURSE?.length) {
    const rows = await prisma.course.findMany({
      where: { id: { in: idsByType.COURSE } },
      select: { id: true, title: true, mode: true, price: true, images: true },
    })
    for (const r of rows) items.push({
      itemType: "COURSE", itemId: r.id, href: `/learning/${r.id}`,
      title: r.title, subtitle: r.mode, priceLabel: formatCurrency(r.price),
      image: parseImages(r.images)[0], typeLabel: WISHLIST_TYPE_META.COURSE.label,
      savedAt: savedAtByKey.get(`COURSE:${r.id}`)!,
    })
  }

  items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" title="Back to dashboard" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle badge="Saved" badgeIcon={Heart} title="Wishlist" subtitle="Everything you've saved across Korpo." />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-card shadow-sm">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nothing saved yet</h3>
          <p className="text-muted-foreground mb-4">Tap the heart on any post's photo to save it here.</p>
          <Button asChild size="sm">
            <Link href="/marketplace"><Plus className="h-4 w-4" /> Browse listings</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <WishlistItemCard key={`${item.itemType}:${item.itemId}`} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
