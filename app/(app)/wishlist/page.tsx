export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { Heart, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageTitle } from "@/components/ui/page-title"
import { ListingCard } from "@/components/shared/ListingCard"

export const metadata: Metadata = { title: "Wishlist" }

export default async function WishlistPage() {
  const session = await auth()
  const userId  = session!.user!.id

  const rows = await prisma.wishlist.findMany({
    where: { userId, itemType: "LISTING" },
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

  const listings = rows.filter((r) => r.listing).map((r) => r.listing!)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" title="Back to dashboard" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle badge="Saved" badgeIcon={Heart} title="Wishlist" subtitle="Listings you've saved for later." />
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-card shadow-sm">
          <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nothing saved yet</h3>
          <p className="text-muted-foreground mb-4">Tap the heart on any listing's photo to save it here.</p>
          <Button asChild size="sm">
            <Link href="/marketplace"><Plus className="h-4 w-4" /> Browse listings</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              href={`/marketplace/${listing.id}`}
              title={listing.title}
              subtitle={listing.description}
              price={listing.price}
              images={listing.images}
              author={listing.user}
              badge={listing.category}
              city={listing.city}
              createdAt={listing.createdAt}
              condition={listing.condition}
              isNegotiable={listing.isNegotiable}
              boostLevel={listing.boostLevel}
              viewCount={listing.viewCount}
              isOwn={listing.user.id === userId}
              listingId={listing.id}
              isWishlisted
              serviceBorderColor="border-l-blue-400"
            />
          ))}
        </div>
      )}
    </div>
  )
}
