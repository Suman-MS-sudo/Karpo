import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import { MapPin, Briefcase, Building2, Calendar, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { ListingCard } from "@/components/shared/ListingCard"
import { RatingStars } from "@/components/shared/RatingStars"
import { formatDate, getInitials } from "@/lib/utils"

export default async function PublicProfilePage({ params }: { params: { userId: string } }) {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      company: true,
      membership: true,
      listings: { where: { status: "ACTIVE" }, take: 8, include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } } },
      reviewsReceived: { include: { reviewer: { include: { company: { select: { name: true, logo: true, domain: true } } } } }, orderBy: { createdAt: "desc" }, take: 10 },
    },
  })

  if (!user) notFound()
  const isOwn = session?.user?.id === user.id

  const avgRating = user.reviewsReceived.length > 0
    ? user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / user.reviewsReceived.length
    : 0

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-start gap-5">
          <Avatar className="h-20 w-20 shrink-0">
            <AvatarImage src={user.avatarUrl ?? user.image ?? ""} />
            <AvatarFallback className="text-xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  {user.isVerified && <VerifiedBadge size="md" />}
                  {user.membership?.plan === "PREMIUM" && <Badge variant="premium">Premium</Badge>}
                </div>
                {user.jobTitle && <p className="text-muted-foreground mt-1">{user.jobTitle}</p>}
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                  {user.company && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-4 w-4" />
                      {user.company.logo && <Image src={user.company.logo} alt={user.company.name} width={16} height={16} className="rounded-sm" />}
                      {user.company.name}
                    </span>
                  )}
                  {user.city && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{user.city}</span>}
                  {user.department && <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4" />{user.department}</span>}
                  <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />Joined {formatDate(user.createdAt)}</span>
                </div>
                {user.reviewsReceived.length > 0 && (
                  <div className="mt-2">
                    <RatingStars rating={avgRating} showCount count={user.reviewsReceived.length} />
                  </div>
                )}
              </div>
              <div className="shrink-0">
                {isOwn ? (
                  <Button asChild variant="outline"><Link href="/profile/me">Edit Profile</Link></Button>
                ) : (
                  <Button asChild><Link href={`/messages/${user.id}`}><MessageSquare className="h-4 w-4" /> Message</Link></Button>
                )}
              </div>
            </div>
            {user.bio && <p className="text-muted-foreground mt-3 text-sm">{user.bio}</p>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Active listings */}
          {user.listings.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4">Active Listings ({user.listings.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    id={listing.id}
                    href={`/marketplace/${listing.id}`}
                    title={listing.title}
                    price={listing.price}
                    images={listing.images}
                    author={listing.user}
                    city={listing.city}
                    createdAt={listing.createdAt}
                    serviceBorderColor="border-l-blue-400"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div>
          {user.reviewsReceived.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4">Reviews ({user.reviewsReceived.length})</h2>
              <div className="space-y-3">
                {user.reviewsReceived.map((review) => (
                  <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={review.reviewer.image ?? ""} />
                        <AvatarFallback>{getInitials(review.reviewer.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{review.reviewer.name}</span>
                    </div>
                    <RatingStars rating={review.rating} size="sm" />
                    {review.comment && <p className="text-sm text-muted-foreground mt-2">{review.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
