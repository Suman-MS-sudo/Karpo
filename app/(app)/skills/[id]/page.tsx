import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import {
  ArrowLeft, Star, Globe, MapPin, Clock, Users, BadgeCheck,
  CheckCircle2, Calendar, ExternalLink, Shield, Award,
  TrendingUp, Repeat2, Package, ChevronRight, MessageCircle,
  AlertCircle, Briefcase,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { UserCard } from "@/components/shared/UserCard"
import { formatCurrency, getInitials } from "@/lib/utils"
import { SkillOrderPanel } from "@/components/skills/SkillOrderPanel"
import { SkillOrdersPanel } from "@/components/skills/SkillOrdersPanel"
import { SkillReviewsList } from "@/components/skills/SkillReviewsList"
import { SkillReviewForm } from "@/components/skills/SkillReviewForm"
import { SkillDetailTabs } from "@/components/skills/SkillDetailTabs"

export const dynamic = "force-dynamic"

interface Pkg  { name: string; price: number; durationHrs: number; description: string; features: string[] }
interface FAQ  { q: string; a: string }
interface Avail { days: string[]; slots: string[]; bufferMins: number }

const FORMAT_LABEL: Record<string,string> = { ONLINE: "Online", IN_PERSON: "In-person", BOTH: "Online & In-person" }
const DAY_FULL: Record<string,string>     = { MON:"Monday", TUE:"Tuesday", WED:"Wednesday", THU:"Thursday", FRI:"Friday", SAT:"Saturday", SUN:"Sunday" }

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(rating) ? "text-amber-300 fill-amber-300" : "text-white/25"}`} />)}
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
  const lowestPrice = packages.length > 0 ? Math.min(...packages.map((p) => p.price)) : listing.hourlyRate

  const successRate = listing.totalOrders > 0
    ? Math.round((listing.completedOrders / listing.totalOrders) * 100)
    : null

  const responseLabel = listing.responseTimeMins
    ? listing.responseTimeMins < 60 ? `${listing.responseTimeMins} min` : `${Math.round(listing.responseTimeMins / 60)} hr`
    : null

  const isTopRated = !!(listing.avgRating && listing.avgRating >= 4.7 && listing.reviewCount > 0)
  const avatar = listing.user.avatarUrl ?? listing.user.image

  const sections = [
    { key: "about",        label: "About" },
    { key: "services",     label: "Services" },
    { key: "portfolio",    label: "Portfolio" },
    { key: "reviews",      label: "Reviews", count: listing.reviewCount },
    { key: "skills",       label: "Skills" },
    { key: "availability", label: "Availability" },
  ]

  return (
    <div className="relative min-h-full overflow-hidden">
      {/* Page-wide decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] via-accent/[0.04] to-background" />
        <div
          className="absolute inset-0 opacity-[0.3] dark:opacity-[0.15]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, black 30%, transparent 100%)",
          }}
        />
        <div className="absolute -top-24 -right-24 h-[380px] w-[380px] rounded-full bg-primary/10 blur-[110px]" />
        <div className="absolute top-1/3 -left-24 h-[320px] w-[320px] rounded-full bg-accent/10 blur-[110px]" />
        <div className="absolute bottom-0 right-1/4 h-[280px] w-[280px] rounded-full bg-amber-400/[0.07] blur-[110px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/skills" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to Skills
      </Link>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl text-white p-6 sm:p-8 mb-6 shadow-2xl shadow-primary/20">
        {/* Background image, with a gradient wash so white text stays legible */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/profile-hero-bg.png)" }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b]/80 via-primary/60 to-accent/50" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" aria-hidden />
        <div className="relative flex flex-col sm:flex-row items-start gap-5">
          <Avatar className="h-24 w-24 rounded-2xl ring-2 ring-white/30 shrink-0 shadow-xl">
            <AvatarImage src={avatar ?? ""} className="object-cover" />
            <AvatarFallback className="rounded-2xl text-2xl bg-white/15 text-white">{getInitials(listing.user.name)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{listing.user.name}</h1>
              {listing.user.isVerified && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              )}
              {isTopRated && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/90 text-amber-950">
                  Top Rated
                </span>
              )}
            </div>
            <p className="text-white/85 mt-1">{listing.title}</p>
            <div className="flex items-center gap-4 mt-2.5 text-sm text-white/70 flex-wrap">
              {listing.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{listing.location}</span>}
              {listing.avgRating && listing.reviewCount > 0 && (
                <span className="flex items-center gap-1.5"><Stars rating={listing.avgRating} />{listing.avgRating.toFixed(1)} ({listing.reviewCount} reviews)</span>
              )}
              {successRate !== null && (
                <span className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5" />{successRate}% Job Success</span>
              )}
            </div>
          </div>

          {!isOwner && (
            <div className="flex items-center gap-2 shrink-0">
              <Button asChild className="bg-white text-primary hover:bg-white/90 shadow-lg">
                <Link href="#book"><Briefcase className="h-4 w-4 mr-1.5" />Hire Now</Link>
              </Button>
              <Button asChild variant="secondary" className="bg-white/15 text-white hover:bg-white/25 ring-1 ring-white/30">
                <Link href={`/messages/${listing.userId}?context=${listing.id}&type=skill`}>
                  <MessageCircle className="h-4 w-4 mr-1.5" />Message
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat strip ───────────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-card ring-1 ring-border/60 shadow-sm grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60 mb-6">
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold">{listing.yearsExp ? `${listing.yearsExp}+ Yrs` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Experience</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold">{listing.completedOrders > 0 ? `${listing.completedOrders}+` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Projects Completed</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold">{responseLabel ? `~${responseLabel}` : "—"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Response Time</p>
        </div>
        <div className="px-5 py-4 text-center">
          <p className="text-lg font-bold flex items-center justify-center gap-1"><Globe className="h-3.5 w-3.5" />{FORMAT_LABEL[listing.format]}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Format</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Main: flowing sections with sticky section nav ─────────────────── */}
        <div className="lg:col-span-2">
          <SkillDetailTabs sections={sections}>
            <div className="space-y-8">

              {/* About */}
              <div id="about" className="scroll-mt-20 space-y-6">
                <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-6">
                  <h2 className="font-semibold mb-3">About Me</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                </div>

                {(listing.deliverables.length > 0 || listing.requirements) && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {listing.deliverables.length > 0 && (
                      <div className="rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 ring-1 ring-emerald-200 dark:ring-emerald-800 p-5">
                        <h3 className="font-semibold text-sm mb-3 text-emerald-700 dark:text-emerald-300 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />What you&apos;ll get</h3>
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
                      <div className="rounded-3xl bg-amber-50 dark:bg-amber-950/20 ring-1 ring-amber-200 dark:ring-amber-800 p-5">
                        <h3 className="font-semibold text-sm mb-3 text-amber-700 dark:text-amber-300 flex items-center gap-2"><AlertCircle className="h-4 w-4" />Prerequisites</h3>
                        <p className="text-sm text-amber-700 dark:text-amber-300">{listing.requirements}</p>
                      </div>
                    )}
                  </div>
                )}

                {faqs.length > 0 && (
                  <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-6">
                    <h2 className="font-semibold mb-4">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                      {faqs.map((faq, i) => (
                        <div key={i}>
                          <p className="font-semibold text-sm mb-1 flex items-center gap-2"><ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />{faq.q}</p>
                          <p className="text-sm text-muted-foreground ml-5">{faq.a}</p>
                          {i < faqs.length - 1 && <div className="mt-4 border-t border-border/60" />}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="rounded-3xl bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-800 p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2 text-blue-800 dark:text-blue-300"><Shield className="h-5 w-5" />How It Works</h2>
                  <ol className="space-y-3">
                    {[
                      ["Place an Inquiry", "Select a package and describe your needs. The seller reviews and confirms."],
                      ["Confirm & Schedule", "Once confirmed, you'll receive session details and meeting link."],
                      ["Work Gets Done", "Attend your session or receive the deliverables as agreed."],
                      ["Approve & Review", "Mark the delivery approved, and share your experience with a review."],
                    ].map(([title, desc], i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-200 dark:ring-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">{title}</p>
                          <p className="text-xs text-blue-700 dark:text-blue-400 mt-0.5">{desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* Services */}
              <div id="services" className="scroll-mt-20 space-y-6">
                {packages.length > 0 && (
                  <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-6">
                    <h2 className="font-semibold mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-primary" />Packages</h2>
                    <div className="grid sm:grid-cols-3 gap-4">
                      {packages.map((pkg, i) => {
                        const highlight = i === 1
                        return (
                          <div key={i} className={`rounded-2xl p-5 flex flex-col ${highlight ? "ring-2 ring-primary/40 bg-primary/5 shadow-lg shadow-primary/10" : "ring-1 ring-border/60 bg-muted/20"}`}>
                            {highlight && <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2">Most Popular</p>}
                            <p className="font-bold text-sm mb-1">{pkg.name}</p>
                            <p className="text-2xl font-bold text-primary mb-1">{formatCurrency(pkg.price)}</p>
                            <p className="text-xs text-muted-foreground mb-4">{pkg.durationHrs}h · {pkg.description}</p>
                            <ul className="space-y-1.5 flex-1">
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

                {listing.pricingModel === "HOURLY" && listing.hourlyRate && (
                  <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-6">
                    <h2 className="font-semibold mb-3">Pricing</h2>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-primary">{formatCurrency(listing.hourlyRate)}</span>
                      <span className="text-muted-foreground">/ hour</span>
                    </div>
                  </div>
                )}

                {packages.length === 0 && !(listing.pricingModel === "HOURLY" && listing.hourlyRate) && (
                  <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-6 text-center text-sm text-muted-foreground">
                    No packages listed — message to discuss pricing.
                  </div>
                )}
              </div>

              {/* Portfolio */}
              <div id="portfolio" className="scroll-mt-20">
                <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-6">
                  <h2 className="font-semibold mb-4">Portfolio</h2>
                  {listing.portfolioUrl ? (
                    <a
                      href={listing.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-3 rounded-2xl ring-1 ring-border/60 bg-muted/20 p-5 hover:ring-primary/30 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <ExternalLink className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">View full portfolio</p>
                          <p className="text-xs text-muted-foreground truncate">{listing.portfolioUrl}</p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    </a>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No portfolio link added yet.</p>
                  )}
                </div>
              </div>

              {/* Reviews */}
              <div id="reviews" className="scroll-mt-20">
                <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-6">
                  <h2 className="font-semibold mb-4">What Clients Say</h2>
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
              </div>

              {/* Skills */}
              <div id="skills" className="scroll-mt-20">
                <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-6">
                  <h2 className="font-semibold mb-4">Skills</h2>
                  {listing.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {listing.skills.map((s) => (
                        <span key={s} className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-full ring-1 ring-border/60">{s}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No skills listed yet.</p>
                  )}
                  {listing.certifications.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border/60">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Certifications</p>
                      <div className="space-y-2">
                        {listing.certifications.map((c, i) => (
                          <p key={i} className="text-sm flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-blue-500 shrink-0" />{c}</p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Availability */}
              <div id="availability" className="scroll-mt-20">
                <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-6">
                  <h2 className="font-semibold mb-4">Availability</h2>
                  {avail && (avail.days?.length > 0 || avail.slots?.length > 0) ? (
                    <>
                      {avail.days?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Available days</p>
                          <div className="flex flex-wrap gap-2">
                            {avail.days.map((d) => <span key={d} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full ring-1 ring-blue-200 dark:ring-blue-800">{DAY_FULL[d] ?? d}</span>)}
                          </div>
                        </div>
                      )}
                      {avail.slots?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Available time slots (IST)</p>
                          <div className="flex flex-wrap gap-2">
                            {avail.slots.map((s) => <span key={s} className="text-xs bg-muted px-2.5 py-1 rounded-full ring-1 ring-border/60">{s}</span>)}
                          </div>
                        </div>
                      )}
                      {avail.bufferMins > 0 && <p className="text-xs text-muted-foreground mt-3">{avail.bufferMins} min buffer between sessions</p>}
                      {listing.maxClientsPerMonth && <p className="text-xs text-muted-foreground mt-1">Max {listing.maxClientsPerMonth} clients per month</p>}
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No availability schedule set — message to check timing.</p>
                  )}
                </div>
              </div>

            </div>
          </SkillDetailTabs>
        </div>

        {/* ── Sidebar ────────────────────────────────────── */}
        <div className="space-y-4">
          <div id="book" className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-5 space-y-5 sticky top-4 scroll-mt-4">
            {/* Price */}
            {lowestPrice != null && (
              <div className="text-center pb-4 border-b border-border/60">
                <p className="text-xs text-muted-foreground">{listing.pricingModel === "HOURLY" ? "Hourly rate" : "Starting from"}</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(lowestPrice)}</p>
                {listing.pricingModel === "HOURLY" && <p className="text-xs text-muted-foreground">/ hour</p>}
                {listing.pricingModel === "PACKAGE" && packages.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{packages.length} packages available</p>
                )}
              </div>
            )}

            {/* My Services quick list */}
            {packages.length > 0 && (
              <div className="pb-4 border-b border-border/60">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">My Services</p>
                <div className="space-y-2.5">
                  {packages.map((pkg, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate pr-2">{pkg.name}</span>
                      <span className="font-semibold shrink-0">{formatCurrency(pkg.price)}<span className="text-muted-foreground font-normal">/{pkg.durationHrs}h</span></span>
                    </div>
                  ))}
                </div>
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

            {(listing.portfolioUrl || listing.linkedIn) && (
              <div className="flex gap-3 flex-wrap pt-3 border-t border-border/60">
                {listing.portfolioUrl && <a href={listing.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3" />Portfolio</a>}
                {listing.linkedIn     && <a href={listing.linkedIn}     target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline"><ExternalLink className="h-3 w-3" />LinkedIn</a>}
              </div>
            )}

            {/* Seller card */}
            <div className="pt-3 border-t border-border/60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">About the Seller</p>
              <UserCard user={listing.user} size="md" />
              {listing.user.bio && <p className="text-xs text-muted-foreground mt-2 line-clamp-3">{listing.user.bio}</p>}
            </div>

            {/* CTA */}
            <div className="pt-3 border-t border-border/60">
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
            <div className="rounded-3xl bg-card ring-1 ring-border/60 shadow-sm p-5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">More by {listing.user.name?.split(" ")[0]}</p>
              <div className="space-y-3">
                {listing.user.skillListings.filter((l) => l.id !== listing.id).map((l) => (
                  <Link key={l.id} href={`/skills/${l.id}`} className="flex items-start gap-2 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">{l.title}</p>
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
    </div>
  )
}
