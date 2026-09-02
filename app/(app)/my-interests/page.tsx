export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ThumbsUp, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageTitle } from "@/components/ui/page-title"
import { ListingCard } from "@/components/shared/ListingCard"

export const metadata: Metadata = { title: "My Interests" }

const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Interest sent",
  ACCEPTED:  "Seller accepted",
  CONFIRMED: "Visit confirmed",
  DECLINED:  "Declined",
  DONE:      "Visit done",
}

export default async function MyInterestsPage() {
  const session = await auth()
  const userId  = session!.user!.id

  // One row per listing — a rider may have both an INTEREST and a later
  // VISIT engagement on the same listing, so keep only the most recent.
  const rows = await prisma.listingEngagement.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
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

  const seen = new Set<string>()
  const items = rows.filter((r) => {
    if (!r.listing || seen.has(r.listingId)) return false
    seen.add(r.listingId)
    return true
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" title="Back to dashboard" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle badge="Interests" badgeIcon={ThumbsUp} title="My Interests" subtitle="Listings you've expressed interest in or requested a visit for." />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-card shadow-sm">
          <ThumbsUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No interests yet</h3>
          <p className="text-muted-foreground mb-4">Listings you show interest in or request a visit for will show up here.</p>
          <Button asChild size="sm">
            <Link href="/marketplace"><Plus className="h-4 w-4" /> Browse listings</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((r) => {
            const listing = r.listing!
            return (
              <ListingCard
                key={r.id}
                id={listing.id}
                href={`/marketplace/${listing.id}`}
                title={listing.title}
                subtitle={listing.description}
                price={listing.price}
                images={listing.images}
                author={listing.user}
                badge={listing.category}
                tags={[STATUS_LABEL[r.status] ?? r.status]}
                city={listing.city}
                createdAt={listing.createdAt}
                condition={listing.condition}
                isNegotiable={listing.isNegotiable}
                boostLevel={listing.boostLevel}
                viewCount={listing.viewCount}
                isOwn={listing.user.id === userId}
                listingId={listing.id}
                serviceBorderColor="border-l-blue-400"
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
