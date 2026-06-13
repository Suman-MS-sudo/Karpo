export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Image from "next/image"
import Link from "next/link"
import loadDynamic from "next/dynamic"
import {
  MapPin, Calendar, Eye, Handshake, ShieldCheck,
  Package, Phone, MessageSquare, Tag, Star, CheckCircle2,
  Info, Truck, Users, ChevronRight, ExternalLink,
  Clock, Award, Zap, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BoostButton }             from "@/components/marketplace/BoostButton"
import { OfferButton }             from "@/components/marketplace/OfferButton"
import { OwnerOffersPanel }        from "@/components/marketplace/OwnerOffersPanel"
import { DistanceText }            from "@/components/marketplace/DistanceText"
import { ReportButton }            from "@/components/marketplace/ReportButton"
import { ListingEngagePanel }      from "@/components/marketplace/ListingEngagePanel"
import { ListingEngagementPanel }  from "@/components/marketplace/ListingEngagementPanel"
import { formatCurrency, formatRelativeTime, getInitials } from "@/lib/utils"
import { LISTING_CONDITIONS, LISTING_CATEGORIES } from "@/config/services"

const MapView = loadDynamic(
  () => import("@/components/rentals/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-[220px] rounded-2xl bg-muted animate-pulse border border-border" /> }
)

// ─── Condition explanations ────────────────────────────────────────────────

const CONDITION_DETAIL: Record<string, { icon: string; desc: string }> = {
  NEW:      { icon: "✨", desc: "Sealed box, never opened or used. Full manufacturer warranty." },
  LIKE_NEW: { icon: "🌟", desc: "Used once or twice, no visible wear. May or may not have original packaging." },
  GOOD:     { icon: "👍", desc: "Regularly used but well maintained. Minor signs of use, fully functional." },
  FAIR:     { icon: "🔧", desc: "Visible wear and tear, possibly minor flaws. Works as expected." },
  POOR:     { icon: "⚙️", desc: "Significant wear or damage. Sold for parts or repair. Priced accordingly." },
}

const MEETING_DETAIL: Record<string, { icon: any; label: string; desc: string }> = {
  PICKUP:  { icon: MapPin,  label: "Pickup only",          desc: "Buyer collects from seller's location." },
  DELIVER: { icon: Truck,   label: "Delivery available",   desc: "Seller can deliver to buyer's location (may have cost)." },
  BOTH:    { icon: Users,   label: "Pickup or delivery",   desc: "Flexible — discuss with the seller." },
}

// ─── Helper components ─────────────────────────────────────────────────────

function SpecRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

function SectionCard({ title, icon: Icon, children, className = "" }: {
  title: string; icon: any; children: React.ReactNode; className?: string
}) {
  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden ${className}`}>
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border bg-muted/30">
        <Icon className="h-3.5 w-3.5 text-primary-600" />
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  const raw = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      user: {
        include: {
          company:    { select: { name: true, logo: true, domain: true } },
          membership: { select: { plan: true } },
        },
      },
    },
  })

  if (!raw) notFound()

  const isOwner   = session?.user?.id === raw.userId
  const isSold    = raw.status === "SOLD"
  const isExpired = raw.status === "EXPIRED"

  // Fetch myEngagement BEFORE the auth gate so sold-via-engagement buyers aren't blocked
  const [acceptedDeal, myEngagement] = await Promise.all([
    isSold
      ? prisma.listingOffer.findFirst({
          where:   { listingId: params.id, status: "ACCEPTED" },
          include: {
            buyer: {
              select: {
                id: true, name: true, email: true, phone: true,
                avatarUrl: true, image: true, isVerified: true,
                jobTitle: true, department: true,
                company: { select: { name: true, logo: true, domain: true } },
              },
            },
          },
        })
      : null,
    session?.user?.id && !isOwner
      ? prisma.listingEngagement.findUnique({
          where: { listingId_userId: { listingId: params.id, userId: session.user.id } },
          select: { id: true, type: true, status: true, visitDate: true, visitTime: true },
        })
      : null,
  ])

  // A buyer whose visit led to CLOSE_DEAL is also an accepted buyer
  const isEngagementDealBuyer = isSold && myEngagement?.type === "VISIT" && myEngagement?.status === "ACCEPTED"
  const isAcceptedBuyer = isSold && (acceptedDeal?.buyer.id === session?.user?.id || isEngagementDealBuyer)
  if ((isSold || isExpired) && !isOwner && !isAcceptedBuyer) notFound()

  const [existingOffer, offerCount, engagementCount, engagementDealBuyer, similarListings] = await Promise.all([
    session?.user?.id && !isOwner && !isSold
      ? prisma.listingOffer.findUnique({
          where: { listingId_buyerId: { listingId: params.id, buyerId: session.user.id } },
          select: { amount: true, status: true },
        })
      : null,
    isOwner
      ? prisma.listingOffer.count({ where: { listingId: params.id } })
      : 0,
    isOwner
      ? prisma.listingEngagement.count({ where: { listingId: params.id } })
      : 0,
    // For sold listings with no offer buyer, find who closed the deal via engagement
    isSold && isOwner && !acceptedDeal
      ? prisma.listingEngagement.findFirst({
          where: { listingId: params.id, type: "VISIT", status: "ACCEPTED" },
          include: {
            user: {
              select: {
                id: true, name: true, email: true, phone: true,
                avatarUrl: true, image: true, isVerified: true,
                jobTitle: true, department: true,
                company: { select: { name: true } },
              },
            },
          },
        })
      : null,
    prisma.listing.findMany({
      where: {
        id:       { not: params.id },
        category: raw.category,
        city:     raw.city,
        status:   "ACTIVE",
      },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: {
        id: true, title: true, price: true, condition: true,
        images: true, city: true, area: true, createdAt: true,
        user: { select: { name: true, company: { select: { name: true } } } },
      },
    }),
  ])

  if (!isOwner && !isSold && !isExpired) {
    prisma.listing.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } }).catch(() => null)
    raw.viewCount += 1
  }

  const listing    = raw
  const condMeta   = LISTING_CONDITIONS.find((c) => c.value === listing.condition)
  const condDetail = CONDITION_DETAIL[listing.condition]
  const catMeta    = LISTING_CATEGORIES.find((c) => c.value === listing.category)
  const meetMeta   = MEETING_DETAIL[listing.meetingPref ?? "BOTH"]
  const MeetIcon   = meetMeta.icon
  const now        = new Date()
  const isBoostActive    = listing.isBoosted && listing.boostExpiresAt && new Date(listing.boostExpiresAt) > now
  const hasLocation      = !!(listing.latitude && listing.longitude)
  // Who bought — via price offer or via visit/CLOSE_DEAL
  const dealBuyer  = acceptedDeal?.buyer ?? (engagementDealBuyer as any)?.user ?? null
  const dealLabel  = acceptedDeal ? `Offer of ${formatCurrency(acceptedDeal.amount)} accepted` : "Deal agreed after site visit"

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 flex-wrap">
        <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
        {catMeta && (
          <>
            <ChevronRight className="h-3 w-3" />
            <Link href={`/marketplace?category=${listing.category}`} className="hover:text-foreground transition-colors">{catMeta.label}</Link>
          </>
        )}
        {listing.subcategory && (
          <>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{listing.subcategory}</span>
          </>
        )}
      </nav>

      <div className="grid lg:grid-cols-3 gap-8 items-start">

        {/* ── Left: main content ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Image gallery */}
          <div className="bg-muted/30 border border-border rounded-2xl overflow-hidden">
            {listing.images.length > 0 ? (
              <div className="p-2 space-y-2">
                {/* Hero image */}
                <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                  <Image src={listing.images[0]} alt={listing.title} fill
                    className="object-contain" sizes="(max-width:1024px) 100vw, 66vw" priority />
                  {isSold && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-2xl font-extrabold text-white tracking-widest border-4 border-white/80 px-6 py-2 rounded-xl rotate-[-12deg] shadow-xl uppercase">Sold</span>
                    </div>
                  )}
                  {/* Boost badge */}
                  {!isSold && isBoostActive && (
                    <div className="absolute top-3 left-3">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full shadow-lg bg-amber-400 text-white">
                        {listing.boostLevel === "SUPER" ? "💥 Super Featured" : "⭐ Featured"}
                      </span>
                    </div>
                  )}
                  {/* Image count */}
                  {listing.images.length > 1 && (
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                      1 / {listing.images.length}
                    </div>
                  )}
                </div>
                {/* Thumbnails */}
                {listing.images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {listing.images.slice(1, 6).map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border">
                        <Image src={img} alt="" fill className="object-contain hover:scale-105 transition-transform cursor-zoom-in" sizes="20vw" />
                        {i === 4 && listing.images.length > 6 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                            <span className="text-white font-bold text-sm">+{listing.images.length - 6}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] flex items-center justify-center">
                <Package className="h-16 w-16 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Title + price header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {catMeta && (
                  <Link href={`/marketplace?category=${listing.category}`}>
                    <Badge variant="secondary" className="hover:bg-muted cursor-pointer">{catMeta.label}</Badge>
                  </Link>
                )}
                {listing.subcategory && (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">{listing.subcategory}</span>
                )}
                {condMeta && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${condMeta.badge}`}>
                    {condDetail?.icon} {condMeta.label}
                  </span>
                )}
                {listing.isNegotiable && !isSold && (
                  <span className="flex items-center gap-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-full">
                    <Handshake className="h-3 w-3" /> Negotiable
                  </span>
                )}
                {isSold && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-700">
                    Sold
                  </span>
                )}
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-primary-600">{formatCurrency(listing.price)}</p>
              {isSold && acceptedDeal && (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-0.5">Sold for {formatCurrency(acceptedDeal.amount)}</p>
              )}
              {listing.isNegotiable && !isSold && (
                <p className="text-xs text-muted-foreground mt-1">Price is negotiable</p>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground py-3 border-y border-border">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {listing.area ? `${listing.area}, ${listing.city}` : listing.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Listed {formatRelativeTime(listing.createdAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              {listing.viewCount} views
            </span>
            {hasLocation && <DistanceText lat={listing.latitude!} lng={listing.longitude!} />}
          </div>

          {/* Item specifications */}
          <SectionCard title="Item Details" icon={Tag}>
            <div className="divide-y divide-border/50">
              <SpecRow icon={Tag}      label="Category"     value={catMeta?.label ?? listing.category} />
              {listing.subcategory && <SpecRow icon={ChevronRight} label="Subcategory" value={listing.subcategory} />}
              {listing.brand        && <SpecRow icon={Award}  label="Brand"         value={listing.brand} />}
              {listing.purchaseYear && <SpecRow icon={Calendar} label="Purchased"    value={listing.purchaseYear.toString()} />}
              {listing.warranty && listing.warranty !== "No warranty"
                                    && <SpecRow icon={ShieldCheck} label="Warranty" value={listing.warranty} />}
              <SpecRow icon={Star}    label="Condition"    value={`${condDetail?.icon ?? ""} ${condMeta?.label ?? listing.condition}`} />
              <SpecRow icon={MeetIcon} label="Handover"   value={meetMeta.label} />
              <SpecRow icon={MapPin}  label="Location"     value={listing.area ? `${listing.area}, ${listing.city}` : listing.city} />
            </div>
          </SectionCard>

          {/* Condition explained */}
          {condDetail && (
            <div className={`flex items-start gap-3 p-4 rounded-xl border ${condMeta?.badge ?? "border-border bg-muted/30"}`}>
              <span className="text-xl leading-none mt-0.5">{condDetail.icon}</span>
              <div>
                <p className="text-sm font-semibold">{condMeta?.label} — what this means</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{condDetail.desc}</p>
              </div>
            </div>
          )}

          {/* Description */}
          <SectionCard title="Description" icon={Info}>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{listing.description}</p>
          </SectionCard>

          {/* Handover / meeting preference */}
          <SectionCard title="Handover Preference" icon={Truck}>
            <div className="flex items-start gap-4">
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                listing.meetingPref === "PICKUP"  ? "bg-blue-100 dark:bg-blue-900/30" :
                listing.meetingPref === "DELIVER" ? "bg-emerald-100 dark:bg-emerald-900/30" :
                "bg-violet-100 dark:bg-violet-900/30"
              }`}>
                <MeetIcon className={`h-5 w-5 ${
                  listing.meetingPref === "PICKUP"  ? "text-blue-600 dark:text-blue-400" :
                  listing.meetingPref === "DELIVER" ? "text-emerald-600 dark:text-emerald-400" :
                  "text-violet-600 dark:text-violet-400"
                }`} />
              </div>
              <div>
                <p className="font-semibold text-sm">{meetMeta.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{meetMeta.desc}</p>
                {listing.area && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Based in {listing.area}, {listing.city}
                  </p>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Map */}
          {hasLocation && (
            <SectionCard title="Approximate Location" icon={MapPin}>
              <MapView
                latitude={listing.latitude!}
                longitude={listing.longitude!}
                address={listing.area ? `${listing.area}, ${listing.city}` : listing.city}
                zoom={13}
              />
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Exact location shared by seller after you connect.
              </p>
            </SectionCard>
          )}

          {/* Safety guidelines */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <p className="font-semibold text-sm text-amber-800 dark:text-amber-300">Safety Guidelines</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-2.5">
              {[
                { icon: Users,        text: "Meet in a public place — office lobby, café, or mall." },
                { icon: Eye,          text: "Inspect the item thoroughly before paying." },
                { icon: AlertTriangle,text: "Never share OTP, passwords, or bank details." },
                { icon: MessageSquare,text: "Keep all communication on Korpo for your records." },
                { icon: ShieldCheck,  text: "Only buy from verified corporate employees." },
                { icon: Zap,          text: "Report suspicious listings immediately." },
              ].map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-snug">{text}</p>
                </div>
              ))}
            </div>
            {!isOwner && !isSold && (
              <div className="pt-2 border-t border-amber-200 dark:border-amber-700">
                <ReportButton listingId={listing.id} />
              </div>
            )}
          </div>

          {/* Similar listings */}
          {similarListings.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm">Similar listings in {listing.city}</h2>
                <Link href={`/marketplace?category=${listing.category}&city=${listing.city}`}
                  className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors">
                  View all <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {similarListings.map((s) => {
                  const sc = LISTING_CONDITIONS.find((c) => c.value === s.condition)
                  return (
                    <Link key={s.id} href={`/marketplace/${s.id}`}
                      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-border/60 hover:shadow-sm transition-all">
                      <div className="relative aspect-square bg-muted">
                        {s.images[0]
                          ? <Image src={s.images[0]} alt={s.title} fill className="object-contain group-hover:scale-105 transition-transform" sizes="25vw" />
                          : <Package className="h-8 w-8 text-muted-foreground/20 absolute inset-0 m-auto" />
                        }
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-semibold truncate leading-tight">{s.title}</p>
                        <p className="text-xs font-bold text-primary-600 mt-1">{formatCurrency(s.price)}</p>
                        {sc && <p className="text-[10px] text-muted-foreground mt-0.5">{sc.label}</p>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── Right: sidebar ──────────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-8">

          {/* Price card */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(listing.price)}</p>
                {listing.isNegotiable && !isSold && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                    <Handshake className="h-3 w-3" /> Open to negotiation
                  </p>
                )}
                {!listing.isNegotiable && !isSold && (
                  <p className="text-xs text-muted-foreground mt-1">Fixed price</p>
                )}
              </div>
              {condMeta && (
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border shrink-0 ${condMeta.badge}`}>
                  {condDetail?.icon} {condMeta.label}
                </span>
              )}
            </div>
          </div>

          {/* ── OWNER PANEL ──────────────────────────────────────────────── */}
          {isOwner && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-sm">Your Listing</p>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5" /> {listing.viewCount}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isSold ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" :
                    "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                  }`}>
                    {isSold ? "Sold" : "Active"}
                  </span>
                </div>
              </div>

              {isSold ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-300">
                    🎉 <strong>Deal closed!</strong> Your listing has been sold.
                  </div>
                  {/* Show buyer — via offer OR via engagement CLOSE_DEAL */}
                  {dealBuyer && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Buyer</p>
                        <span className="text-[10px] text-muted-foreground">{dealLabel}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={dealBuyer.avatarUrl ?? dealBuyer.image ?? ""} />
                          <AvatarFallback className="text-xs font-semibold bg-primary-100 dark:bg-primary-900/50 text-primary-700">
                            {getInitials(dealBuyer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{dealBuyer.name ?? "Anonymous"}</p>
                          {dealBuyer.company && <p className="text-xs text-muted-foreground truncate">{dealBuyer.company.name}</p>}
                          {dealBuyer.jobTitle && <p className="text-xs text-muted-foreground truncate">{dealBuyer.jobTitle}</p>}
                        </div>
                      </div>
                      <Button className="w-full gap-2" asChild>
                        <Link href={`/messages/${dealBuyer.id}`}>
                          <MessageSquare className="h-4 w-4" /> Message Buyer
                        </Link>
                      </Button>
                      {dealBuyer.phone && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="outline" size="sm" className="w-full gap-1.5" asChild>
                            <a href={`tel:+91${dealBuyer.phone}`}><Phone className="h-3.5 w-3.5" /> Call</a>
                          </Button>
                          <Button variant="outline" size="sm"
                            className="w-full border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                            asChild>
                            <a href={`https://wa.me/91${dealBuyer.phone}?text=${encodeURIComponent(`Hi! Regarding your purchase of "${listing.title}" on Korpo.`)}`}
                              target="_blank" rel="noopener noreferrer">WhatsApp</a>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/marketplace/${listing.id}/edit`}>✏️ Edit</Link>
                    </Button>
                    <form action={`/api/listings/${listing.id}/close`} method="POST">
                      <Button variant="secondary" size="sm" className="w-full" type="submit">✅ Mark Sold</Button>
                    </form>
                  </div>
                  <ListingEngagementPanel listingId={listing.id} initialCount={engagementCount as number} />
                  <OwnerOffersPanel listingId={listing.id} initialCount={offerCount as number} />
                  <div className="pt-1 border-t border-border">
                    <BoostButton listingId={listing.id} boostLevel={listing.boostLevel} boostExpiresAt={listing.boostExpiresAt} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── BUYER: DEAL CONFIRMED PANEL ─────────────────────────────── */}
          {isAcceptedBuyer && isSold && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              {/* How the deal was closed */}
              <div className="rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 space-y-1">
                <p className="font-bold text-green-800 dark:text-green-300 text-base">🎉 Deal confirmed!</p>
                {acceptedDeal && acceptedDeal.buyer.id === session?.user?.id && (
                  <p className="text-xs text-green-700 dark:text-green-400">
                    Your offer of <strong>{formatCurrency(acceptedDeal.amount)}</strong> was accepted by the seller.
                  </p>
                )}
                {isEngagementDealBuyer && (
                  <p className="text-xs text-green-700 dark:text-green-400">
                    The seller agreed to the deal after your site visit. Time to arrange the handover!
                  </p>
                )}
              </div>

              {/* Deal journey tracker */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Deal Progress</p>
                {[
                  { label: "Browsed listing",      done: true },
                  { label: isEngagementDealBuyer ? "Visited in person" : "Made an offer",  done: true },
                  { label: "Seller agreed",         done: true },
                  { label: "Handover pending",      done: false, active: true },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      step.done ? "bg-emerald-500 text-white" : step.active ? "border-2 border-emerald-500 bg-transparent" : "bg-muted text-muted-foreground"
                    }`}>
                      {step.done ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs ${step.done ? "text-foreground font-medium" : step.active ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-muted-foreground"}`}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Seller info */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Seller</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-emerald-200 dark:ring-emerald-800">
                    <AvatarImage src={listing.user.avatarUrl ?? listing.user.image ?? ""} />
                    <AvatarFallback className="text-xs font-semibold">{getInitials(listing.user.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{listing.user.name}</p>
                    {listing.user.company && <p className="text-xs text-muted-foreground">{listing.user.company.name}</p>}
                    {listing.user.isVerified && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <Button className="w-full gap-2" asChild>
                <Link href={`/messages/${listing.userId}`}><MessageSquare className="h-4 w-4" /> Message Seller</Link>
              </Button>
              {listing.phone && (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="gap-1.5" asChild>
                    <a href={`tel:+91${listing.phone}`}><Phone className="h-3.5 w-3.5" /> Call</a>
                  </Button>
                  <Button variant="outline" size="sm"
                    className="border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                    asChild>
                    <a href={`https://wa.me/91${listing.phone}?text=${encodeURIComponent(`Hi! Regarding our deal for "${listing.title}" on Korpo. Can we arrange the handover?`)}`}
                      target="_blank" rel="noopener noreferrer">WhatsApp</a>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVE BUYER PANEL ──────────────────────────────────────── */}
          {!isOwner && !isSold && (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              {/* Seller info */}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Seller</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-11 w-11 ring-2 ring-border">
                  <AvatarImage src={listing.user.avatarUrl ?? listing.user.image ?? ""} />
                  <AvatarFallback className="font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700">
                    {getInitials(listing.user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-semibold text-sm leading-tight">{listing.user.name}</p>
                  {listing.user.company && <p className="text-xs text-muted-foreground truncate">{listing.user.company.name}</p>}
                  {listing.user.jobTitle && <p className="text-xs text-muted-foreground truncate">{listing.user.jobTitle}</p>}
                  <div className="flex items-center gap-2 mt-0.5">
                    {listing.user.isVerified && (
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {listing.user.membership?.plan && listing.user.membership.plan !== "FREE" && (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                        <Star className="h-3 w-3" /> {listing.user.membership.plan}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact — always visible for buy/sell */}
              <div className="space-y-2">
                <Button className="w-full gap-2" asChild>
                  <Link href={`/messages/${listing.userId}?context=${listing.id}&type=listing`}>
                    <MessageSquare className="h-4 w-4" /> Message Seller
                  </Link>
                </Button>
                {listing.phone && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="gap-1.5" asChild>
                      <a href={`tel:+91${listing.phone}`}><Phone className="h-3.5 w-3.5" /> Call</a>
                    </Button>
                    <Button variant="outline" size="sm"
                      className="border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                      asChild>
                      <a href={`https://wa.me/91${listing.phone}?text=${encodeURIComponent(`Hi! I saw your listing "${listing.title}" on Korpo (${formatCurrency(listing.price)}). Is it still available?`)}`}
                        target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    </Button>
                  </div>
                )}
              </div>

              {/* Offer button — inline, triggered from engage panel */}
              {listing.isNegotiable && (
                <div id="offer-button-container">
                  <OfferButton listingId={listing.id} defaultAmount={listing.price} existingOffer={existingOffer ?? null} />
                </div>
              )}

              <div className="pt-3 border-t border-border">
                <ListingEngagePanel
                  listingId={listing.id}
                  myEngagement={myEngagement as any}
                  sellerName={listing.user.name ?? "Seller"}
                  isNegotiable={listing.isNegotiable}
                />
              </div>

              <div className="pt-3 border-t border-border flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-snug">
                  Verified corporate employee. Keep communication on Korpo for your records.
                </p>
              </div>
            </div>
          )}

          {/* Quick facts sidebar card */}
          {!isSold && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Facts</p>
              {listing.brand        && <SpecRow icon={Award}   label="Brand"     value={listing.brand} />}
              {listing.purchaseYear && <SpecRow icon={Calendar} label="Year"     value={listing.purchaseYear.toString()} />}
              {listing.warranty && listing.warranty !== "No warranty"
                                    && <SpecRow icon={ShieldCheck} label="Warranty" value={listing.warranty} />}
              <SpecRow icon={MeetIcon} label="Handover" value={meetMeta.label} />
              <SpecRow icon={MapPin}   label="City"     value={listing.city} />
            </div>
          )}

          {/* Browse more */}
          {!isSold && catMeta && (
            <Link href={`/marketplace?category=${listing.category}&city=${listing.city}`}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:border-border/60 hover:shadow-sm transition-all bg-card group text-sm">
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                More {catMeta.label} in {listing.city}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
