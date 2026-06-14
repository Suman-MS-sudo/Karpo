import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import {
  ArrowLeft, Star, Globe, MapPin, Clock, Users, BadgeCheck,
  CheckCircle2, Calendar, ExternalLink, Shield, Award,
  TrendingUp, Repeat2, Package, ChevronRight, MessageSquare,
  AlertCircle,
} from "lucide-react"
import { SocialShare } from "@/components/shared/SocialShare"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCard } from "@/components/shared/UserCard"
import { formatCurrency } from "@/lib/utils"
import { SkillOrderPanel } from "@/components/skills/SkillOrderPanel"
import { SkillOrdersPanel } from "@/components/skills/SkillOrdersPanel"
import { SkillReviewsList } from "@/components/skills/SkillReviewsList"
import { SkillReviewForm } from "@/components/skills/SkillReviewForm"

export const dynamic = "force-dynamic"

interface Pkg  { name: string; price: number; durationHrs: number; description: string; features: string[] }
interface FAQ  { q: string; a: string }
interface Avail { days: string[]; slots: string[]; bufferMins: number }

const FORMAT_LABEL: Record<string,string> = { ONLINE: "Online", IN_PERSON: "In-person", BOTH: "Online & In-person" }
const DAY_FULL: Record<string,string>     = { MON:"Monday", TUE:"Tuesday", WED:"Wednesday", THU:"Thursday", FRI:"Friday", SAT:"Saturday", SUN:"Sunday" }

const CATEGORY_COLORS: Record<string,string> = {
  TECH:"bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", DATA:"bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  DESIGN:"bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300", ENGINEERING:"bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  MARKETING:"bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300", BUSINESS:"bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  FINANCE:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", LEGAL:"bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  LANGUAGE:"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300", COACHING:"bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  CREATIVE:"bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300", WELLNESS:"bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => <Star key={n} className={`h-4 w-4 ${n <= Math.round(rating) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`} />)}
    </span>
  )
}

export default async function SkillDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  const listing = await prisma.skillListing.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true, name: true, avatarUrl: true, image: true, bio: true, phone: true,
          jobTitle: true, department: true, isVerified: true, createdAt: true,
          company: { select: { name: true, logo: true, domain: true } },
          skillListings: { where: { status:"ACTIVE" }, select: { id: true, title: true, avgRating: true, reviewCount: true }, take: 3 },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { id: true, name: true, avatarUrl: true, image: true, jobTitle: true, department: true } } },
      },
      _count: { select: { orders: true, reviews: true } },
    },
  })

  if (!listing || listing.status === "ARCHIVED") notFound()

  const isOwner  = session?.user?.id === listing.userId
  const isSeller = isOwner

  // Viewer's latest non-terminal order
  const myOrder = session?.user?.id && !isOwner
    ? await prisma.skillOrder.findFirst({
        where:   { listingId: params.id, buyerId: session.user.id },
        orderBy: { createdAt: "desc" },
      })
    : null

  // Can the viewer leave a review? (completed order, no existing review)
  const canReview = myOrder?.status === "COMPLETED"
    ? !(await prisma.skillReview.findUnique({ where: { orderId: myOrder.id } }))
    : false

  const packages    = (listing.packages   as Pkg[]  | null) ?? []
  const faqs        = (listing.faqs       as FAQ[]  | null) ?? []
  const avail       = (listing.availability as Avail | null)
  const catColor    = CATEGORY_COLORS[listing.category] ?? "bg-muted text-muted-foreground"
  const lowestPrice = packages.length > 0 ? Math.min(...packages.map((p) => p.price)) : listing.hourlyRate

  const successRate = listing.totalOrders > 0
    ? Math.round((listing.completedOrders / listing.totalOrders) * 100)
    : null

  const responseLabel = listing.responseTimeMins
    ? listing.responseTimeMins < 60 ? `${listing.responseTimeMins} min` : `${Math.round(listing.responseTimeMins / 60)} hr`
    : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/skills" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to Skills
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Main ──────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">

          {/* Hero */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${catColor}`}>{listing.category}</span>
              {listing.subcategory && <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">{listing.subcategory}</span>}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                {listing.format === "IN_PERSON" ? <MapPin className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {FORMAT_LABEL[listing.format]}
              </span>
              {listing.format !== "ONLINE" && listing.location && (
                <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{listing.location}</span>
              )}
              {listing.isFeatured && <Badge variant="outline" className="text-amber-600 border-amber-300">⭐ Featured</Badge>}
              {listing.isVerified && <Badge variant="outline" className="text-blue-600 border-blue-300 flex items-center gap-1"><BadgeCheck className="h-3 w-3" />Verified</Badge>}
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold leading-tight">{listing.title}</h1>
                {listing.tagline && <p className="text-muted-foreground mt-1">{listing.tagline}</p>}
              </div>
              <SocialShare
                title={`${listing.title} — Skill on Korpo`}
                path={`/skills/${params.id}`}
                variant="icon"
              />
            </div>

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 py-3 border-y border-border text-sm">
              {listing.avgRating && listing.reviewCount > 0 ? (
                <div className="flex items-center gap-1.5">
                  <Stars rating={listing.avgRating} />
                  <span className="font-bold">{listing.avgRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">({listing.reviewCount} reviews)</span>
                </div>
              ) : <span className="text-muted-foreground text-xs italic">No reviews yet</span>}
              {listing.totalOrders > 0 && (
                <span className="flex items-center gap-1.5 text-muted-foreground"><Users className="h-4 w-4" />{listing.totalOrders} orders</span>
              )}
              {successRate !== null && (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400"><TrendingUp className="h-4 w-4" />{successRate}% success rate</span>
              )}
              {responseLabel && (
                <span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="h-4 w-4" />Replies in ~{responseLabel}</span>
              )}
            </div>

            {/* Skills tags */}
            {listing.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {listing.skills.map((s) => (
                  <span key={s} className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border">{s}</span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">About This Service</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
          </div>

          {/* Deliverables + Requirements */}
          {(listing.deliverables.length > 0 || listing.requirements) && (
            <div className="grid sm:grid-cols-2 gap-4">
              {listing.deliverables.length > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5">
                  <h3 className="font-semibold text-sm mb-3 text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />What you'll get</h3>
                  <ul className="space-y-2">
                    {listing.deliverables.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5" />{d}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {listing.requirements && (
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
                  <h3 className="font-semibold text-sm mb-3 text-amber-700 dark:text-amber-300 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Prerequisites</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">{listing.requirements}</p>
                </div>
              )}
            </div>
          )}

          {/* Packages */}
          {packages.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-primary-500" />Packages</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {packages.map((pkg, i) => {
                  const highlight = i === 1
                  return (
                    <div key={i} className={`rounded-2xl border p-5 flex flex-col ${highlight ? "border-primary-400 bg-primary-50 dark:bg-primary-950/20 shadow-md" : "border-border bg-muted/20"}`}>
                      {highlight && <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-2">Most Popular</p>}
                      <p className="font-bold text-sm mb-1">{pkg.name}</p>
                      <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">{formatCurrency(pkg.price)}</p>
                      <p className="text-xs text-muted-foreground mb-4">{pkg.durationHrs}h · {pkg.description}</p>
                      <ul className="space-y-1.5 flex-1 mb-4">
                        {pkg.features.map((f, fi) => (
                          <li key={fi} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />{f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Hourly rate */}
          {listing.pricingModel === "HOURLY" && listing.hourlyRate && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-3">Pricing</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(listing.hourlyRate)}</span>
                <span className="text-muted-foreground">/ hour</span>
              </div>
            </div>
          )}

          {/* Availability */}
          {avail && (avail.days?.length > 0 || avail.slots?.length > 0) && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-500" />Availability</h2>
              {avail.days?.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Available days</p>
                  <div className="flex flex-wrap gap-2">
                    {avail.days.map((d) => <span key={d} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">{DAY_FULL[d] ?? d}</span>)}
                  </div>
                </div>
              )}
              {avail.slots?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Available time slots (IST)</p>
                  <div className="flex flex-wrap gap-2">
                    {avail.slots.map((s) => <span key={s} className="text-xs bg-muted px-2.5 py-1 rounded-full border border-border">{s}</span>)}
                  </div>
                </div>
              )}
              {avail.bufferMins > 0 && <p className="text-xs text-muted-foreground mt-3">{avail.bufferMins} min buffer between sessions</p>}
              {listing.maxClientsPerMonth && <p className="text-xs text-muted-foreground mt-1">Max {listing.maxClientsPerMonth} clients per month</p>}
            </div>
          )}

          {/* FAQs */}
          {faqs.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <div key={i}>
                    <p className="font-semibold text-sm mb-1 flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-primary-500 shrink-0" />{faq.q}</p>
                    <p className="text-sm text-muted-foreground ml-5">{faq.a}</p>
                    {i < faqs.length - 1 && <div className="mt-4 border-t border-border" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-card border border-border rounded-2xl p-6" id="reviews">
            <h2 className="font-semibold mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" />Reviews ({listing.reviewCount})</h2>
            {canReview && myOrder && (
              <div className="mb-6">
                <SkillReviewForm listingId={listing.id} orderId={myOrder.id} sellerName={listing.user.name ?? "Seller"} />
              </div>
            )}
            <SkillReviewsList
              listingId={listing.id}
              reviews={listing.reviews as any}
              avgRating={listing.avgRating}
              reviewCount={listing.reviewCount}
              isSeller={isSeller}
            />
          </div>

          {/* How it works */}
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-300"><Shield className="h-5 w-5" />How It Works</h2>
            <ol className="space-y-3">
              {[
                ["Place an Inquiry", "Select a package and describe your needs. The seller reviews and confirms."],
                ["Confirm & Schedule", "Once confirmed, you'll receive session details and meeting link."],
                ["Work Gets Done", "Attend your session or receive the deliverables as agreed."],
                ["Approve & Review", "Mark the delivery approved, and share your experience with a review."],
              ].map(([title, desc], i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{title}</p>
                    <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* ── Sidebar ────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-5 sticky top-4">
            {/* Price */}
            {lowestPrice != null && (
              <div className="text-center pb-4 border-b border-border">
                <p className="text-xs text-muted-foreground">{listing.pricingModel === "HOURLY" ? "Hourly rate" : "Starting from"}</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(lowestPrice)}</p>
                {listing.pricingModel === "HOURLY" && <p className="text-xs text-muted-foreground">/ hour</p>}
                {listing.pricingModel === "PACKAGE" && packages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{packages.length} packages available</p>
                )}
              </div>
            )}

            {/* Quick stats */}
            <div className="space-y-2 text-sm">
              {listing.avgRating && listing.reviewCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Star className="h-3.5 w-3.5" />Rating</span>
                  <span className="font-semibold">{listing.avgRating.toFixed(1)} / 5</span>
                </div>
              )}
              {listing.completedOrders > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Repeat2 className="h-3.5 w-3.5" />Completed</span>
                  <span className="font-semibold">{listing.completedOrders} orders</span>
                </div>
              )}
              {listing.yearsExp && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Award className="h-3.5 w-3.5" />Experience</span>
                  <span className="font-semibold">{listing.yearsExp}+ years</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" />Format</span>
                <span className="font-semibold">{FORMAT_LABEL[listing.format]}</span>
              </div>
            </div>

            {/* Credentials */}
            {listing.certifications.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Certifications</p>
                <div className="space-y-1">
                  {listing.certifications.map((c, i) => (
                    <p key={i} className="text-xs flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />{c}</p>
                  ))}
                </div>
              </div>
            )}
            {(listing.portfolioUrl || listing.linkedIn) && (
              <div className="flex gap-2 flex-wrap">
                {listing.portfolioUrl && <a href={listing.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"><ExternalLink className="h-3 w-3" />Portfolio</a>}
                {listing.linkedIn     && <a href={listing.linkedIn}     target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"><ExternalLink className="h-3 w-3" />LinkedIn</a>}
              </div>
            )}

            {/* Seller card */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">About the Seller</p>
              <UserCard user={listing.user} size="md" />
              {listing.user.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{listing.user.bio}</p>}
            </div>

            {/* CTA */}
            <div className="pt-3 border-t border-border">
              {isOwner ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-8" asChild>
                      <Link href={`/skills/${listing.id}/edit`}>Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
                      {listing.status === "ACTIVE" ? "Pause" : "Activate"}
                    </Button>
                  </div>
                  <SkillOrdersPanel listingId={listing.id} initialCount={listing._count.orders} />
                </div>
              ) : (
                <SkillOrderPanel
                  listingId={listing.id}
                  sellerId={listing.userId}
                  sellerName={listing.user.name ?? "Seller"}
                  myOrder={myOrder as any}
                  packages={packages}
                  pricingModel={listing.pricingModel}
                  hourlyRate={listing.hourlyRate}
                />
              )}
            </div>
          </div>

          {/* Other listings by same seller */}
          {listing.user.skillListings.filter((l) => l.id !== listing.id).length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">More by {listing.user.name?.split(" ")[0]}</p>
              <div className="space-y-3">
                {listing.user.skillListings.filter((l) => l.id !== listing.id).map((l) => (
                  <Link key={l.id} href={`/skills/${l.id}`} className="flex items-start gap-2 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{l.title}</p>
                      {l.avgRating && <p className="text-[10px] text-amber-500 mt-0.5">★ {l.avgRating.toFixed(1)} ({l.reviewCount})</p>}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
