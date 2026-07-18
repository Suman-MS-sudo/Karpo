import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import {
  MapPin, Briefcase, Building2, Calendar, MessageSquare,
  AtSign, Clock, Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { ListingCard } from "@/components/shared/ListingCard"
import { RatingStars } from "@/components/shared/RatingStars"
import { SocialShare } from "@/components/shared/SocialShare"
import { PROFILE_SOCIAL_PLATFORMS } from "@/lib/socialPlatforms"
import { formatDate, getInitials } from "@/lib/utils"

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

  const avgRating = user.reviewsReceived.length > 0
    ? user.reviewsReceived.reduce((acc, r) => acc + r.rating, 0) / user.reviewsReceived.length
    : 0

  const socialLinks = (user.socialLinks as Record<string, string> | null) ?? {}
  const hasSocialLinks = Object.values(socialLinks).some(Boolean)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Profile hero ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">

        {/* Gradient banner */}
        <div className="h-28 bg-gradient-to-br from-[#1e1b4b] via-primary to-accent relative overflow-hidden">
          <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_right,white,transparent_60%)]" aria-hidden />
        </div>

        <div className="px-6 pb-6">
          {/* Avatar overlapping banner */}
          <div className="flex items-end justify-between -mt-12 mb-4">
            <Avatar className="h-24 w-24 ring-4 ring-card shadow-lg shrink-0">
              <AvatarImage src={user.avatarUrl ?? user.image ?? ""} />
              <AvatarFallback className="text-2xl font-semibold">{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2 pb-1">
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
                <Button asChild size="sm">
                  <Link href={`/messages/${user.id}`}>
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Message
                  </Link>
                </Button>
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
            {(user as any).yearsOfExp != null && (
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0" />
                {(user as any).yearsOfExp} yr{(user as any).yearsOfExp !== 1 ? "s" : ""} experience
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
      <div className="rounded-2xl border border-border bg-card grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border mb-6">
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold">{(user as any).yearsOfExp != null ? `${(user as any).yearsOfExp}+ Yrs` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Experience</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold">{user.listings.length + user.skillListings.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Active Listings</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold flex items-center justify-center gap-1">
            {avgRating > 0 ? <><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{avgRating.toFixed(1)}</> : "New"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Rating</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold">{user.createdAt.getFullYear()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Member Since</p>
        </div>
      </div>

      {/* ── Content grid ──────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Active listings */}
        <div className="lg:col-span-2 space-y-6">
          {user.skillListings.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                Skill Services
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {user.skillListings.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {user.skillListings.map((listing) => {
                  const rawPackages = listing.packages as unknown
                  const packages: { price: number }[] =
                    Array.isArray(rawPackages) ? rawPackages
                    : typeof rawPackages === "string" ? (() => { try { return JSON.parse(rawPackages) } catch { return [] } })()
                    : []
                  const startPrice = listing.pricingModel === "HOURLY" ? listing.hourlyRate : packages.length ? Math.min(...packages.map(p => p.price)) : null
                  return (
                    <Link
                      key={listing.id}
                      href={`/skills/${listing.id}`}
                      className="group block rounded-2xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all"
                    >
                      <p className="text-xs font-medium text-primary">{listing.category}</p>
                      <h3 className="font-semibold text-sm mt-1 group-hover:text-primary transition-colors line-clamp-1">{listing.title}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{listing.tagline ?? listing.description}</p>
                      <p className="text-sm font-bold mt-3">
                        {startPrice != null ? `₹${startPrice.toLocaleString()}` : "Contact"}
                        {listing.pricingModel === "HOURLY" && <span className="text-xs font-normal text-muted-foreground">/hr</span>}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {user.listings.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                Active Listings
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {user.listings.length}
                </span>
              </h2>
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

          {user.listings.length === 0 && user.skillListings.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <p className="text-muted-foreground text-sm">No active listings.</p>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="space-y-4">
          {user.reviewsReceived.length > 0 && (
            <div>
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                Reviews
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {user.reviewsReceived.length}
                </span>
              </h2>
              <div className="space-y-3">
                {user.reviewsReceived.map((review) => (
                  <div key={review.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={review.reviewer.image ?? ""} />
                        <AvatarFallback className="text-xs">{getInitials(review.reviewer.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium leading-none">{review.reviewer.name}</p>
                      </div>
                    </div>
                    <RatingStars rating={review.rating} size="sm" />
                    {review.comment && (
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats card */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stats</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Listings posted</span>
                <span className="font-semibold">{user.listings.length}</span>
              </div>
              {user.reviewsReceived.length > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg. rating</span>
                  <span className="font-semibold flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {avgRating.toFixed(1)}
                  </span>
                </div>
              )}
              {(user as any).reputationScore > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Reputation</span>
                  <span className="font-semibold">{(user as any).reputationScore}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
