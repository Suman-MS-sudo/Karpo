"use client"
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Star } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ListingCard } from "@/components/shared/ListingCard"
import { RatingStars } from "@/components/shared/RatingStars"
import { ProfileLink } from "@/components/shared/ProfileLink"
import { getInitials, cn } from "@/lib/utils"

interface SkillItem {
  id: string
  category: string
  title: string
  tagline: string | null
  startPrice: number | null
  isHourly: boolean
}

interface ListingItem {
  id: string
  title: string
  price: number
  images: string[]
  city: string | null
  createdAt: string
  author: {
    id: string
    name: string | null
    image: string | null
    avatarUrl: string | null
    isVerified: boolean
    jobTitle: string | null
    department: string | null
    company: { name: string; logo?: string | null; domain?: string } | null
  }
}

interface ReviewItem {
  id: string
  rating: number
  comment: string | null
  reviewer: { id: string; name: string | null; image: string | null }
}

interface Props {
  skills: SkillItem[]
  listings: ListingItem[]
  reviews: ReviewItem[]
}

type TabId = "skills" | "listings" | "reviews"

export function ProfileServiceTabs({ skills, listings, reviews }: Props) {
  // Same thumbnails as the left-nav service rail (components/layout/ServiceRail.tsx),
  // so a service reads as the same visual "thing" everywhere in the app.
  const tabs: { id: TabId; label: string; image?: string; icon?: typeof Star; count: number; bg: string }[] = [
    { id: "skills" as const,   label: "Skill Services",  image: "/images/services/skills.jpeg",      count: skills.length,   bg: "bg-violet-50 dark:bg-violet-900/20" },
    { id: "listings" as const, label: "Active Listings", image: "/images/services/marketplace.jpeg", count: listings.length, bg: "bg-blue-50 dark:bg-blue-900/20" },
    { id: "reviews" as const,  label: "Reviews",         icon: Star,                                 count: reviews.length,  bg: "bg-amber-50 dark:bg-amber-900/20" },
  ].filter((t) => t.count > 0)

  const [selected, setSelected] = useState<TabId | null>(null)

  if (tabs.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground text-sm">No public activity yet.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Service icon row */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        {tabs.map((t) => {
          const isActive = selected === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(isActive ? null : t.id)}
              className={cn(
                "flex flex-col items-center gap-1.5 px-4 py-3 rounded-2xl border transition-all min-w-[92px]",
                isActive ? cn(t.bg, "border-transparent shadow-sm") : "border-border hover:bg-muted/50"
              )}
            >
              <span className={cn("h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden", t.bg)}>
                {t.image ? (
                  <Image src={t.image} alt={t.label} width={36} height={36} className="h-full w-full object-cover" />
                ) : t.icon ? (
                  <t.icon className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                ) : null}
              </span>
              <span className="text-xs font-medium text-foreground">{t.label}</span>
              <span className="text-[10px] text-muted-foreground">{t.count}</span>
            </button>
          )
        })}
      </div>

      {/* Content — only shown once a service icon is selected */}
      {selected === null && (
        <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
          <p className="text-muted-foreground text-sm">Select a service above to view its listings.</p>
        </div>
      )}

      {selected === "skills" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {skills.map((listing) => (
            <Link
              key={listing.id}
              href={`/skills/${listing.id}`}
              className="group block rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <p className="text-xs font-medium text-primary">{listing.category}</p>
              <h3 className="font-semibold text-sm mt-1 group-hover:text-primary transition-colors line-clamp-1">{listing.title}</h3>
              {listing.tagline && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{listing.tagline}</p>}
              <p className="text-sm font-bold mt-3">
                {listing.startPrice != null ? `₹${listing.startPrice.toLocaleString()}` : "Contact"}
                {listing.isHourly && <span className="text-xs font-normal text-muted-foreground">/hr</span>}
              </p>
            </Link>
          ))}
        </div>
      )}

      {selected === "listings" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              id={listing.id}
              href={`/marketplace/${listing.id}`}
              title={listing.title}
              price={listing.price}
              images={listing.images}
              author={listing.author}
              city={listing.city}
              createdAt={listing.createdAt}
              serviceBorderColor="border-l-blue-400"
            />
          ))}
        </div>
      )}

      {selected === "reviews" && (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ProfileLink userId={review.reviewer.id}>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={review.reviewer.image ?? ""} />
                    <AvatarFallback className="text-xs">{getInitials(review.reviewer.name)}</AvatarFallback>
                  </Avatar>
                </ProfileLink>
                <ProfileLink userId={review.reviewer.id} className="block text-sm font-medium leading-none">
                  {review.reviewer.name}
                </ProfileLink>
              </div>
              <RatingStars rating={review.rating} size="sm" />
              {review.comment && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
