"use client"
import Link from "next/link"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "./VerifiedBadge"
import { PremiumStrip } from "./PremiumBadge"
import { formatCurrency, formatRelativeTime, truncate, getInitials } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { Lock, Eye, Handshake, Pencil, Crown } from "lucide-react"
import { LISTING_CONDITIONS } from "@/config/services"

interface ListingAuthor {
  id: string
  name?: string | null
  image?: string | null
  avatarUrl?: string | null
  isVerified?: boolean
  jobTitle?: string | null
  department?: string | null
  company?: { name: string; logo?: string | null; domain?: string } | null
}

interface ListingCardProps {
  id?: string
  href: string
  title: string
  subtitle?: string
  price?: number
  priceLabel?: string
  image?: string | null
  images?: string[]
  author: ListingAuthor
  badge?: string
  badgeVariant?: "default" | "secondary" | "success" | "warning" | "premium" | "verified"
  tags?: string[]
  city?: string | null
  createdAt: Date | string
  isPremium?: boolean
  serviceBorderColor?: string
  // Marketplace-specific
  condition?: string
  isNegotiable?: boolean
  boostLevel?: string
  viewCount?: number
  isOwn?: boolean
  listingId?: string
}

function getConditionMeta(condition?: string) {
  return LISTING_CONDITIONS.find((c) => c.value === condition)
}

function getBoostStyle(boostLevel?: string): { border: string; glow: string; badge: string | null } {
  switch (boostLevel) {
    case "SUPER":
      return {
        border: "border-purple-400",
        glow: "shadow-md shadow-purple-100 dark:shadow-purple-900/50 ring-1 ring-purple-200 dark:ring-purple-700",
        badge: "💥 Super Featured",
      }
    case "FEATURED":
      return {
        border: "border-amber-400",
        glow: "shadow-md shadow-amber-100 dark:shadow-amber-900/50 ring-1 ring-amber-200 dark:ring-amber-700",
        badge: "⭐ Featured",
      }
    case "BASIC":
      return {
        border: "border-blue-300",
        glow: "",
        badge: "🚀 Boosted",
      }
    default:
      return { border: "", glow: "", badge: null }
  }
}

export function ListingCard({
  href,
  title,
  subtitle,
  price,
  priceLabel,
  image,
  images,
  author,
  badge,
  badgeVariant = "default",
  tags,
  city,
  createdAt,
  isPremium,
  serviceBorderColor = "border-l-blue-400",
  condition,
  isNegotiable,
  boostLevel,
  viewCount,
  isOwn = false,
  listingId,
}: ListingCardProps) {
  const displayImage = image ?? images?.[0]
  const condMeta = getConditionMeta(condition)
  const boost = getBoostStyle(boostLevel)
  const isBoosted = boostLevel && boostLevel !== "NONE"
  const leftBorder = isOwn ? "border-l-emerald-500" : isBoosted ? boost.border : serviceBorderColor

  return (
    <div className="group relative">
      {/* Stretched base link — covers the whole card */}
      <Link href={href} className="absolute inset-0 z-0 rounded-xl" aria-label={title} />
      <div
        className={cn(
          "bg-card rounded-xl border border-border hover:shadow-md transition-all duration-200 overflow-hidden",
          "border-l-4",
          leftBorder,
          boost.glow
        )}
      >
        {/* Premium strip at very top */}
        {isBoosted && <PremiumStrip />}
        {/* Image area */}
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
          {displayImage ? (
            <Image
              src={displayImage}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              {badge === "ELECTRONICS" ? "📱" : badge === "VEHICLE" ? "🚗" : badge === "FURNITURE" ? "🪑" : "📦"}
            </div>
          )}

          {isPremium && (
            <div className="absolute inset-0 backdrop-blur-sm bg-black/30 flex items-center justify-center rounded-t-xl">
              <div className="flex items-center gap-2 text-white bg-black/50 rounded-full px-3 py-1.5">
                <Lock className="h-4 w-4" />
                <span className="text-sm font-medium">Premium</span>
              </div>
            </div>
          )}

          {/* Your listing badge — top left */}
          {isOwn ? (
            <div className="absolute top-2 left-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
                Your listing
              </span>
            </div>
          ) : boost.badge && (
            <div className="absolute top-2 left-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/90 dark:bg-gray-900/90 shadow-sm border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300">
                {boost.badge}
              </span>
            </div>
          )}

          {/* Condition badge — top right */}
          {condMeta && (
            <div className="absolute top-2 right-2">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full border", condMeta.badge)}>
                {condMeta.label}
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          {/* Category badge when no image */}
          {!displayImage && badge && (
            <div className="mb-2">
              <Badge variant={badgeVariant}>{badge}</Badge>
            </div>
          )}

          <h3 className="font-semibold text-foreground group-hover:text-accent-400 transition-colors line-clamp-1 cursor-pointer">
            {title}
          </h3>

          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{truncate(subtitle, 90)}</p>
          )}

          {/* Price row */}
          <div className="mt-2 flex items-center justify-between gap-2">
            {price !== undefined && (
              <p className="text-lg font-bold text-primary-600">
                {formatCurrency(price)}
                {priceLabel && <span className="text-sm font-normal text-muted-foreground ml-1">{priceLabel}</span>}
              </p>
            )}
            {isNegotiable && (
              <span className="flex items-center gap-1 text-xs text-success font-medium">
                <Handshake className="h-3 w-3" /> Negotiable
              </span>
            )}
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-border flex items-center gap-2">
            {isOwn ? (
              /* ── Own listing footer ── */
              <>
                <div className="h-7 w-7 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">You</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 leading-none">Your listing</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-none">{formatRelativeTime(createdAt)}</p>
                </div>
                <Link
                  href={`/marketplace/${listingId}/edit`}
                  className="relative z-10 shrink-0 flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 px-2 py-1 rounded-lg transition-colors"
                >
                  <Pencil className="h-3 w-3" /> Edit
                </Link>
              </>
            ) : (
              /* ── Other seller footer ── */
              <>
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={author.avatarUrl ?? author.image ?? ""} alt={author.name ?? ""} />
                  <AvatarFallback className="text-[10px] font-semibold">{getInitials(author.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-medium truncate leading-none">{author.name ?? "Anonymous"}</span>
                    {author.isVerified && <VerifiedBadge size="sm" />}
                    {isBoosted && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
                  </div>
                  {author.company && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-none">{author.company.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0 space-y-0.5">
                  {city && <p className="text-[10px] text-muted-foreground whitespace-nowrap">{city}</p>}
                  <p className="text-[10px] text-muted-foreground whitespace-nowrap">{formatRelativeTime(createdAt)}</p>
                  {viewCount !== undefined && viewCount > 0 && (
                    <p className="text-[10px] text-muted-foreground flex items-center justify-end gap-0.5">
                      <Eye className="h-2.5 w-2.5" /> {viewCount}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-sm border-l-4 border-l-muted animate-pulse">
      <div className="aspect-video w-full bg-muted rounded-t-xl" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-full" />
        <div className="h-4 bg-muted rounded w-2/3" />
        <div className="h-6 bg-muted rounded w-1/3" />
        <div className="pt-3 border-t border-border flex items-center gap-3">
          <div className="h-8 w-8 bg-muted rounded-full" />
          <div className="h-4 bg-muted rounded w-24" />
        </div>
      </div>
    </div>
  )
}
