export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { ThumbsUp, ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageTitle } from "@/components/ui/page-title"
import { ListingCard } from "@/components/shared/ListingCard"
import { parseImages, cn } from "@/lib/utils"

export const metadata: Metadata = { title: "My Interests" }

const LISTING_STATUS_LABEL: Record<string, string> = {
  PENDING:   "Interest sent",
  ACCEPTED:  "Seller accepted",
  CONFIRMED: "Visit confirmed",
  DECLINED:  "Declined",
  DONE:      "Visit done",
}

const RENTAL_STATUS_LABEL: Record<string, string> = {
  PENDING:   "Interest sent",
  ACCEPTED:  "Owner accepted",
  CONFIRMED: "Visit confirmed",
  DECLINED:  "Declined",
  DONE:      "Visit done",
}

const REFERRAL_STATUS_LABEL: Record<string, string> = {
  PENDING:     "Applied",
  SHORTLISTED: "Shortlisted",
  REFERRED:    "Referred",
  HIRED:       "Hired",
  REJECTED:    "Not selected",
}

interface Item {
  key: string
  href: string
  title: string
  subtitle?: string | null
  price?: number
  priceLabel?: string
  images: string[]
  author: { id: string; name: string | null; image: string | null; avatarUrl: string | null; isVerified: boolean; jobTitle: string | null; department: string | null }
  badge: string
  city: string | null
  createdAt: Date
  isOwn: boolean
  statusTag: string | null
  imageBanner?: { label: string; tone: "success" | "muted" }
  serviceBorderColor: string
  rank: number
}

export default async function MyInterestsPage() {
  const session = await auth()
  const userId  = session!.user!.id

  // ── Marketplace (ListingEngagement) ───────────────────────────────────────
  const listingRows = await prisma.listingEngagement.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      listing: {
        select: {
          id: true, title: true, description: true, price: true, images: true,
          category: true, condition: true, isNegotiable: true, city: true,
          status: true, boostLevel: true, viewCount: true, createdAt: true,
          user: { select: { id: true, name: true, image: true, avatarUrl: true, isVerified: true, jobTitle: true, department: true } },
        },
      },
    },
  })
  const seenListing = new Set<string>()
  const listingEngagements = listingRows.filter((r) => {
    if (!r.listing || seenListing.has(r.listingId)) return false
    seenListing.add(r.listingId)
    return true
  })

  const soldListingIds = listingEngagements.filter((r) => r.listing!.status === "SOLD").map((r) => r.listingId)
  const myAcceptedOfferListingIds = soldListingIds.length
    ? new Set(
        (await prisma.listingOffer.findMany({
          where: { listingId: { in: soldListingIds }, buyerId: userId, status: "ACCEPTED" },
          select: { listingId: true },
        })).map((o) => o.listingId)
      )
    : new Set<string>()

  const listingItems: Item[] = listingEngagements.map((r) => {
    const listing = r.listing!
    const isSold = listing.status === "SOLD"
    const won = isSold && (myAcceptedOfferListingIds.has(r.listingId) || r.status === "ACCEPTED")
    const lost = isSold && !won
    return {
      key: `listing-${listing.id}`,
      href: `/marketplace/${listing.id}`,
      title: listing.title,
      subtitle: listing.description,
      price: listing.price,
      images: parseImages(listing.images),
      author: listing.user,
      badge: listing.category,
      city: listing.city,
      createdAt: listing.createdAt,
      isOwn: listing.user.id === userId,
      statusTag: isSold ? null : LISTING_STATUS_LABEL[r.status] ?? r.status,
      imageBanner: won ? { label: "🎉 Deal done", tone: "success" } : lost ? { label: "No longer available", tone: "muted" } : undefined,
      serviceBorderColor: won ? "border-l-emerald-500" : lost ? "border-l-muted-foreground/30" : "border-l-blue-400",
      rank: won ? 0 : lost ? 2 : 1,
    }
  })

  // ── Rentals (RentalInquiry) ────────────────────────────────────────────────
  const rentalRows = await prisma.rentalInquiry.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      rental: {
        select: {
          id: true, title: true, type: true, rent: true, images: true, city: true,
          status: true, viewCount: true, createdAt: true,
          user: { select: { id: true, name: true, image: true, avatarUrl: true, isVerified: true, jobTitle: true, department: true } },
        },
      },
    },
  })
  const seenRental = new Set<string>()
  const rentalInquiries = rentalRows.filter((r) => {
    if (!r.rental || seenRental.has(r.rentalId)) return false
    seenRental.add(r.rentalId)
    return true
  })

  const rentalItems: Item[] = rentalInquiries.map((r) => {
    const rental = r.rental!
    const unavailable = rental.status !== "ACTIVE"
    return {
      key: `rental-${rental.id}`,
      href: `/rentals/${rental.id}`,
      title: rental.title,
      price: rental.rent,
      priceLabel: "/mo",
      images: parseImages(rental.images),
      author: rental.user,
      badge: rental.type,
      city: rental.city,
      createdAt: rental.createdAt,
      isOwn: rental.user.id === userId,
      statusTag: unavailable ? null : RENTAL_STATUS_LABEL[r.status] ?? r.status,
      imageBanner: unavailable ? { label: rental.status === "FILLED" ? "No longer available" : "Expired", tone: "muted" } : undefined,
      serviceBorderColor: unavailable ? "border-l-muted-foreground/30" : "border-l-emerald-400",
      rank: unavailable ? 2 : 1,
    }
  })

  // ── Job Referrals (ReferralApplication) ───────────────────────────────────
  const referralRows = await prisma.referralApplication.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      referral: {
        select: {
          id: true, title: true, department: true, salaryMin: true, location: true,
          status: true, createdAt: true,
          user: { select: { id: true, name: true, image: true, avatarUrl: true, isVerified: true, jobTitle: true, department: true } },
        },
      },
    },
  })
  const seenReferral = new Set<string>()
  const referralApplications = referralRows.filter((r) => {
    if (!r.referral || seenReferral.has(r.referralId)) return false
    seenReferral.add(r.referralId)
    return true
  })

  const referralItems: Item[] = referralApplications.map((r) => {
    const referral = r.referral!
    const closed = referral.status !== "OPEN"
    return {
      key: `referral-${referral.id}`,
      href: `/referrals/${referral.id}`,
      title: referral.title,
      subtitle: referral.department,
      price: referral.salaryMin ?? undefined,
      priceLabel: referral.salaryMin ? "+/yr" : undefined,
      images: [],
      author: referral.user,
      badge: "REFERRAL",
      city: referral.location,
      createdAt: referral.createdAt,
      isOwn: referral.user.id === userId,
      statusTag: closed ? null : REFERRAL_STATUS_LABEL[r.status] ?? r.status,
      imageBanner: closed ? { label: "No longer open", tone: "muted" } : undefined,
      serviceBorderColor: closed ? "border-l-muted-foreground/30" : "border-l-violet-400",
      rank: closed ? 2 : 1,
    }
  })

  const items = [...listingItems, ...rentalItems, ...referralItems]
    .sort((a, b) => a.rank - b.rank || b.createdAt.getTime() - a.createdAt.getTime())

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" title="Back to dashboard" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <PageTitle badge="Interests" badgeIcon={ThumbsUp} title="My Interests" subtitle="Listings, rentals and referrals you've shown interest in, across every section." />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-card shadow-sm">
          <ThumbsUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No interests yet</h3>
          <p className="text-muted-foreground mb-4">Listings, rentals and referrals you show interest in will show up here.</p>
          <Button asChild size="sm">
            <Link href="/marketplace"><Plus className="h-4 w-4" /> Browse listings</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {items.map((item) => (
            <div key={item.key} className={cn(item.imageBanner?.tone === "muted" && "opacity-70 saturate-50")}>
              <ListingCard
                id={item.key}
                href={item.href}
                title={item.title}
                subtitle={item.subtitle ?? undefined}
                price={item.price}
                priceLabel={item.priceLabel}
                images={item.images}
                author={item.author}
                badge={item.badge}
                tags={item.statusTag ? [item.statusTag] : undefined}
                city={item.city}
                createdAt={item.createdAt}
                isOwn={item.isOwn}
                serviceBorderColor={item.serviceBorderColor}
                imageBanner={item.imageBanner}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
