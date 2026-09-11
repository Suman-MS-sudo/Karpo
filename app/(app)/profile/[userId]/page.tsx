import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import {
  MapPin, Briefcase, Building2, Calendar, MessageSquare,
  AtSign, Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { RatingStars } from "@/components/shared/RatingStars"
import { SocialShare } from "@/components/shared/SocialShare"
import { BlockUserButton } from "@/components/profile/BlockUserButton"
import { ReportUserButton } from "@/components/profile/ReportUserButton"
import { ProfileServiceTabs } from "@/components/profile/ProfileServiceTabs"
import { PROFILE_SOCIAL_PLATFORMS } from "@/lib/socialPlatforms"
import { formatDate, getInitials } from "@/lib/utils"

export const metadata: Metadata = { title: "Profile" }

// ── Helpers ──────────────────────────────────────────────────────────────

function SocialLinksBar({ links }: { links: Record<string, string> }) {
  const active = PROFILE_SOCIAL_PLATFORMS.filter(
    (p) => p.id !== "website" && links[p.id]
  )
  const website = links["website"]

  if (active.length === 0 && !website) return null

  return (
    <div className="flex items-center flex-wrap gap-2 mt-3">
      {active.map(({ id, name, textColor, icon: Icon }) => (
        <a
          key={id}
          href={links[id]}
          target="_blank"
          rel="noopener noreferrer"
          title={name}
          className={`h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors ${textColor}`}
        >
          <Icon />
        </a>
      ))}
      {website && (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-muted/40 hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {/* Globe icon inline */}
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current stroke-[1.5] shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Portfolio
        </a>
      )}
    </div>
  )
}

function SkillTags({ skills }: { skills: string[] }) {
  if (!skills?.length) return null
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {skills.map((s) => (
        <span
          key={s}
          className="px-2.5 py-0.5 bg-muted text-muted-foreground rounded-full text-xs font-medium border border-border"
        >
          {s}
        </span>
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────

export default async function PublicProfilePage({ params }: { params: { userId: string } }) {
  const session = await auth()
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      company:         true,
      membership:      true,
      listings: {
        where:   { status: "ACTIVE" },
        take:    8,
        include: { user: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
      },
      skillListings: {
        where:   { status: "ACTIVE" },
        take:    8,
        orderBy: { createdAt: "desc" },
      },
      reviewsReceived: {
        include:  { reviewer: { include: { company: { select: { name: true, logo: true, domain: true } } } } },
        orderBy:  { createdAt: "desc" },
        take:     10,
      },
    },
  })

  if (!user) notFound()
  const isOwn = session?.user?.id === user.id
  const viewerId = session?.user?.id

  // A FULL block hides each other's profile entirely — check both directions
  // (viewer blocked the profile owner, or the profile owner blocked the viewer).
  let myBlock: { scope: string } | null = null
  if (!isOwn && viewerId) {
    const [outgoing, incoming] = await Promise.all([
      prisma.userBlock.findUnique({ where: { blockerId_blockedId: { blockerId: viewerId, blockedId: user.id } } }),
      prisma.userBlock.findUnique({ where: { blockerId_blockedId: { blockerId: user.id, blockedId: viewerId } } }),
    ])
    myBlock = outgoing
    if (outgoing?.scope === "FULL" || incoming?.scope === "FULL") notFound()
  }

  const avgRating = user.reviewsReceived.length > 0
    ? user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / user.reviewsReceived.length
    : 0

  const socialLinks = (user.socialLinks as Record<string, string> | null) ?? {}
  const hasSocialLinks = Object.values(socialLinks).some(Boolean)

  // ── Data for the service tabs (serialized for the client component) ──────
  const skillsForTabs = user.skillListings.map((listing) => {
    const rawPackages = listing.packages as unknown
    const packages: { price: number }[] =
      Array.isArray(rawPackages) ? rawPackages
      : typeof rawPackages === "string" ? (() => { try { return JSON.parse(rawPackages) } catch { return [] } })()
      : []
    const startPrice = listing.pricingModel === "HOURLY" ? listing.hourlyRate : packages.length ? Math.min(...packages.map(p => p.price)) : null
    return {
      id:         listing.id,
      category:   listing.category,
      title:      listing.title,
      tagline:    listing.tagline ?? listing.description ?? null,
      startPrice,
      isHourly:   listing.pricingModel === "HOURLY",
    }
  })

  const listingsForTabs = user.listings.map((listing) => {
    let images: string[] = []
    try { images = JSON.parse(listing.images) } catch {}
    return {
      id:        listing.id,
      title:     listing.title,
      price:     listing.price,
      images,
      city:      listing.city,
      createdAt: listing.createdAt.toISOString(),
      author:    listing.user,
    }
  })

  const reviewsForTabs = user.reviewsReceived.map((review) => ({
    id:       review.id,
    rating:   review.rating,
    comment:  review.comment,
    reviewer: { id: review.reviewer.id, name: review.reviewer.name, image: review.reviewer.image },
  }))

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Profile hero ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">

        {/* Banner — default plexus artwork (generated in-house, no stock watermark) */}
        <div
          className="h-28 bg-cover bg-center relative overflow-hidden"
          style={{ backgroundImage: "url(/profile-banner-default.svg)" }}
        />

        <div className="px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between -mt-12 mb-4">
            <Avatar className="h-24 w-24 ring-4 ring-card shadow-lg shrink-0">
              <AvatarImage src={user.avatarUrl ?? user.image ?? ""} />
              <AvatarFallback className="text-2xl font-semibold">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 flex-wrap sm:justify-end sm:pb-1">
              <SocialShare
                title={`${user.name} on Korpo`}
                description={user.bio ?? undefined}
                path={`/profile/${user.id}`}
                variant="button"
              />
              {isOwn ? (
                <Button asChild variant="outline" size="sm">
                  <Link href="/profile/me">Edit Profile</Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="sm" className="w-9 px-0 sm:w-auto sm:px-3">
                    <Link href={`/messages/${user.id}`} title="Message">
                      <MessageSquare className="h-3.5 w-3.5 sm:mr-1.5" />
                      <span className="hidden sm:inline">Message</span>
                    </Link>
                  </Button>
                  <BlockUserButton
                    userId={user.id}
                    userName={user.name}
                    initialIsBlocked={!!myBlock}
                    initialScope={(myBlock?.scope as "MESSAGE" | "FULL" | undefined) ?? null}
                  />
                  <ReportUserButton userId={user.id} userName={user.name} />
                </>
              )}
            </div>
          </div>

          {/* Name + badges */}
          <div className="flex items-start gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            {user.isVerified && <VerifiedBadge size="md" />}
            {user.membership?.plan === "PREMIUM" && <Badge variant="premium">Premium</Badge>}
          </div>

          {/* Username */}
          {user.username && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <AtSign className="h-3.5 w-3.5" />{user.username}
            </p>
          )}

          {/* Job title */}
          {user.jobTitle && (
            <p className="text-muted-foreground mt-1 font-medium">{user.jobTitle}</p>
          )}

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-sm text-muted-foreground">
            {isOwn && user.company && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-4 w-4 shrink-0" />
                {user.company.logo && (
                  <Image
                    src={user.company.logo}
                    alt={user.company.name}
                    width={14}
                    height={14}
                    className="rounded-sm"
                  />
                )}
                {user.company.name}
              </span>
            )}
            {user.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0" />{user.city}
              </span>
            )}
            {user.department && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 shrink-0" />{user.department}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
              Joined {formatDate(user.createdAt)}
            </span>
          </div>

          {/* Rating */}
          {user.reviewsReceived.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <RatingStars rating={avgRating} showCount count={user.reviewsReceived.length} />
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-2xl">{user.bio}</p>
          )}

          {/* Social links */}
          {hasSocialLinks && <SocialLinksBar links={socialLinks} />}

          {/* Skills */}
          {(user as any).skills?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Skills</p>
              <SkillTags skills={(user as any).skills} />
            </div>
          )}
        </div>
      </div>

      {/* ── Stat strip ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card grid grid-cols-3 divide-x divide-border mb-6">
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold">{user.listings.length + user.skillListings.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active Listings</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold flex items-center justify-center gap-1">
            {avgRating > 0 && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
            {user.reviewsReceived.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Reviews</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold">{user.createdAt.getFullYear()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Member Since</p>
        </div>
      </div>

      {/* ── Activity — pick a service to view its content ────────────────── */}
      <ProfileServiceTabs skills={skillsForTabs} listings={listingsForTabs} reviews={reviewsForTabs} />
    </div>
  )
}
