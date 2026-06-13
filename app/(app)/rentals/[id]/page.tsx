import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Image from "next/image"
import Link from "next/link"
import loadDynamic from "next/dynamic"
import {
  ArrowLeft, MapPin, Calendar, CheckCircle2, BedDouble, Bath,
  Layers, Users, Eye, Phone, Mail, MessageSquare, Car, Zap,
  Droplets, Flame, Wifi, Home, PencilLine, Compass,
  SquareArrowOutUpRight, Info, ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, getInitials } from "@/lib/utils"
import { RentalInquiryPanel } from "@/components/rentals/RentalInquiryPanel"
import { RentalEngagePanel }  from "@/components/rentals/RentalEngagePanel"
import { RentalReportButton } from "@/components/rentals/RentalReportButton"
import { RentalDeleteButton } from "@/components/rentals/RentalDeleteButton"

const MapView = loadDynamic(
  () => import("@/components/rentals/MapView").then((m) => m.MapView),
  { ssr: false, loading: () => <div className="h-[260px] rounded-2xl bg-muted animate-pulse border border-border" /> }
)

export const dynamic = "force-dynamic"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  APARTMENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ROOM:      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  PG:        "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  FLATMATE:  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  STUDIO:    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  VILLA:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
}

const PARKING_LABEL: Record<string, string> = { NONE:"None", OPEN:"Open Parking", COVERED:"Covered Parking" }
const WATER_LABEL:   Record<string, string> = { "24_7":"24/7", SCHEDULED:"Scheduled Timings", TANKER:"Tanker", CORPORATION:"Corporation" }
const POWER_LABEL:   Record<string, string> = { NONE:"None", FULL:"Full Backup", PARTIAL:"Partial Backup", GENERATOR:"Generator", INVERTER:"Inverter" }
const GAS_LABEL:     Record<string, string> = { NONE:"None", PIPED:"Piped Gas", CYLINDER:"Cylinder" }
const INTERNET_LABEL:Record<string, string> = { NOT_INCLUDED:"Not Included", INCLUDED:"Included", NEGOTIABLE:"Negotiable" }
const BROKERAGE_LABEL:Record<string,string> = { NONE:"No Brokerage", ONE_MONTH:"1 Month Rent", NEGOTIABLE:"Negotiable" }
const PROP_AGE_LABEL:Record<string, string> = { LESS_1:"< 1 Year", "1_5":"1–5 Years", "5_10":"5–10 Years", "10_PLUS":"10+ Years" }

const FURNISHING_LABELS: Record<string, string> = {
  BED:"Bed", SOFA:"Sofa", WARDROBE:"Wardrobe", AC:"AC", TV:"TV",
  FRIDGE:"Refrigerator", WASHING:"Washing Machine", MICRO:"Microwave",
  GEYSER:"Geyser", STUDY:"Study Table", DINING:"Dining Table", CURTAIN:"Curtains",
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border">
        <div className="h-7 w-7 rounded-lg bg-primary-50 dark:bg-primary-950/40 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-primary-600" />
        </div>
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function RuleChip({ label, allowed }: { label: string; allowed: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border ${
      allowed
        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
        : "bg-muted/50 border-border text-muted-foreground"
    }`}>
      <span>{allowed ? "✓" : "✗"}</span>
      {label}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function RentalDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const userId  = session?.user?.id

  const rental = await prisma.rentalPost.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true, name: true, email: true, phone: true,
          avatarUrl: true, image: true, department: true, jobTitle: true,
          isVerified: true, reputationScore: true,
          company: { select: { name: true, logo: true } },
          membership: { select: { plan: true } },
        },
      },
      inquiries: {
        include: {
          user: {
            select: {
              id: true, name: true, email: true, phone: true,
              avatarUrl: true, image: true, department: true, jobTitle: true,
              company: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!rental) notFound()

  const isOwner   = userId === rental.userId
  const isFilled  = rental.status === "FILLED"
  const isExpired = rental.status === "EXPIRED"
  const typeColor = TYPE_COLOR[rental.type] ?? "bg-muted text-muted-foreground"
  const hasLocation = !!(rental.latitude && rental.longitude)

  // Viewer's own engagement record
  const myEngagement = userId && !isOwner
    ? (rental.inquiries.find((i) => i.userId === userId) ?? null)
    : null

  const isAccepted  = myEngagement?.status === "ACCEPTED"
  const isConfirmed = myEngagement?.status === "CONFIRMED"
  const pendingCount = rental.inquiries.filter((i) => ["PENDING", "CONFIRMED"].includes(i.status)).length

  if (!isOwner) {
    prisma.rentalPost.update({ where: { id: params.id }, data: { viewCount: { increment: 1 } } }).catch(() => null)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <Link href="/rentals" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Rentals
        </Link>
        <div className="flex items-center gap-2">
          {isOwner && (
            <>
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href={`/rentals/${params.id}/edit`}>
                  <PencilLine className="h-3.5 w-3.5" /> Edit
                </Link>
              </Button>
              <RentalDeleteButton rentalId={params.id} />
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <Link href="/my-postings?tab=rentals">
                  <Home className="h-3.5 w-3.5" /> My Postings
                </Link>
              </Button>
            </>
          )}
          {!isOwner && !isFilled && <RentalReportButton rentalId={params.id} />}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">

        {/* ── Left / Main column ───────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Image gallery */}
          <div className="rounded-2xl overflow-hidden border border-border bg-muted">
            {rental.images.length > 0 ? (
              <div className="space-y-2 p-2">
                <div className="relative aspect-video rounded-xl overflow-hidden">
                  <Image src={rental.images[0]} alt={rental.title} fill className="object-cover" priority sizes="(max-width:1024px) 100vw, 66vw" />
                  {isFilled && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white font-extrabold text-2xl uppercase tracking-widest border-4 border-white/80 px-6 py-2 rounded-xl rotate-[-12deg]">Filled</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className={`text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full ${typeColor}`}>{rental.type}</span>
                    {rental.furnished !== "UNFURNISHED" && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm">
                        {rental.furnished === "FULLY" ? "Fully Furnished" : "Semi Furnished"}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full backdrop-blur-sm">
                    <Eye className="h-3 w-3" /> {rental.viewCount} views
                  </div>
                </div>
                {rental.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {rental.images.slice(1, 5).map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                        <Image src={img} alt="" fill className="object-cover" sizes="25vw" />
                        {i === 3 && rental.images.length > 5 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                            <span className="text-white font-bold text-sm">+{rental.images.length - 5}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video flex items-center justify-center">
                <Home className="h-12 w-12 text-muted-foreground/20" />
              </div>
            )}
          </div>

          {/* Title + Price */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold leading-tight">{rental.title}</h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {[rental.societyName, rental.area, rental.city].filter(Boolean).join(", ")}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(rental.availableFrom) <= new Date()
                    ? "Available now"
                    : `Available from ${formatDate(rental.availableFrom)}`}
                </span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-3xl font-bold text-primary-600">{formatCurrency(rental.rent)}<span className="text-base font-normal text-muted-foreground">/mo</span></p>
              {rental.deposit && <p className="text-sm text-muted-foreground mt-0.5">Deposit: {formatCurrency(rental.deposit)}</p>}
              {rental.maintenanceAmt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  + {formatCurrency(rental.maintenanceAmt)}/mo maintenance {rental.maintenanceIncluded ? "(included)" : "(extra)"}
                </p>
              )}
            </div>
          </div>

          {/* Quick stat tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: BedDouble, label:"BHK / Type",  value: rental.bhk },
              { icon: Bath,      label:"Bathrooms",   value: rental.bathrooms ? `${rental.bathrooms} Bath` : null },
              { icon: Layers,    label:"Floor",       value: rental.floor != null ? `${rental.floor}${rental.totalFloors ? ` of ${rental.totalFloors}` : ""}` : null },
              { icon: Compass,   label:"Facing",      value: rental.facing },
            ].map(({ icon: Icon, label, value }) => value ? (
              <div key={label} className="bg-muted/40 dark:bg-muted/20 border border-border rounded-xl p-3 text-center">
                <Icon className="h-4 w-4 text-primary-600 mx-auto mb-1.5" />
                <p className="text-sm font-semibold">{value}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
              </div>
            ) : null)}
            {rental.carpetArea && (
              <div className="bg-muted/40 dark:bg-muted/20 border border-border rounded-xl p-3 text-center">
                <SquareArrowOutUpRight className="h-4 w-4 text-primary-600 mx-auto mb-1.5" />
                <p className="text-sm font-semibold">{rental.carpetArea} sq ft</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Carpet Area</p>
              </div>
            )}
          </div>

          {/* About */}
          {rental.description && (
            <SectionCard title="About This Property" icon={Info}>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{rental.description}</p>
            </SectionCard>
          )}

          {/* Location */}
          <SectionCard title="Location" icon={MapPin}>
            <div className="space-y-3">
              <div className="space-y-1">
                {rental.societyName && (
                  <p className="text-sm font-semibold">{rental.societyName}</p>
                )}
                {rental.fullAddress && (
                  <p className="text-sm text-muted-foreground">{rental.fullAddress}</p>
                )}
                {!rental.fullAddress && (
                  <p className="text-sm text-muted-foreground">{[rental.area, rental.city].filter(Boolean).join(", ")}</p>
                )}
                {rental.landmark && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Near {rental.landmark}
                  </p>
                )}
              </div>

              {hasLocation && (
                <MapView
                  latitude={rental.latitude!}
                  longitude={rental.longitude!}
                  address={rental.fullAddress ?? `${rental.area}, ${rental.city}`}
                />
              )}

              {hasLocation && (
                <a
                  href={`https://www.google.com/maps?q=${rental.latitude},${rental.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  <SquareArrowOutUpRight className="h-3.5 w-3.5" />
                  Open in Google Maps
                </a>
              )}
            </div>
          </SectionCard>

          {/* Property details */}
          <SectionCard title="Property Details" icon={Home}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <DetailRow label="Property Type"  value={rental.type.charAt(0) + rental.type.slice(1).toLowerCase()} />
                <DetailRow label="BHK / Room"     value={rental.bhk} />
                <DetailRow label="Carpet Area"    value={rental.carpetArea ? `${rental.carpetArea} sq ft` : null} />
                <DetailRow label="Floor"          value={rental.floor != null ? `${rental.floor}${rental.totalFloors ? ` of ${rental.totalFloors}` : ""}` : null} />
                <DetailRow label="Bathrooms"      value={rental.bathrooms} />
                <DetailRow label="Balconies"      value={rental.balconies ?? 0} />
              </div>
              <div>
                <DetailRow label="Furnishing"     value={rental.furnished.charAt(0) + rental.furnished.slice(1).toLowerCase() + (rental.furnished === "UNFURNISHED" ? "" : " Furnished")} />
                <DetailRow label="Facing"         value={rental.facing} />
                <DetailRow label="Property Age"   value={rental.propertyAge ? PROP_AGE_LABEL[rental.propertyAge] : null} />
                <DetailRow label="Gender"         value={rental.gender === "ANY" ? "Any" : rental.gender === "MALE" ? "Males only" : "Females only"} />
                <DetailRow label="Brokerage"      value={BROKERAGE_LABEL[rental.brokerage ?? "NONE"]} />
              </div>
            </div>
          </SectionCard>

          {/* Furnishing items */}
          {rental.furnished !== "UNFURNISHED" && rental.furnishingItems && rental.furnishingItems.length > 0 && (
            <SectionCard title="Furnishings Included" icon={CheckCircle2}>
              <div className="flex flex-wrap gap-2">
                {rental.furnishingItems.map((key) => (
                  <span key={key} className="flex items-center gap-1.5 text-xs bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1.5 rounded-lg font-medium">
                    <CheckCircle2 className="h-3 w-3" />
                    {FURNISHING_LABELS[key] ?? key}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Parking */}
          <SectionCard title="Parking" icon={Car}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label:"Two-Wheeler", value: PARKING_LABEL[rental.twoWheelerParking ?? "NONE"] },
                { label:"Four-Wheeler",value: PARKING_LABEL[rental.fourWheelerParking ?? "NONE"] },
                { label:"Visitor",     value: rental.visitorParking ? "Available" : "Not available" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
                  <Car className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-sm font-semibold">{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{label} Parking</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Utilities */}
          <SectionCard title="Utilities" icon={Zap}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Droplets, label:"Water",         value: WATER_LABEL[rental.waterSupply   ?? "24_7"] },
                { icon: Zap,      label:"Power Backup",  value: POWER_LABEL[rental.powerBackup   ?? "NONE"] },
                { icon: Flame,    label:"Gas",           value: GAS_LABEL[rental.gasType         ?? "NONE"] },
                { icon: Wifi,     label:"Internet",      value: INTERNET_LABEL[rental.internet   ?? "NOT_INCLUDED"] },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-muted/40 rounded-xl p-3 text-center">
                  <Icon className="h-4 w-4 text-muted-foreground mx-auto mb-1.5" />
                  <p className="text-xs font-semibold leading-tight">{value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Amenities */}
          {rental.amenities.length > 0 && (
            <SectionCard title="Amenities & Facilities" icon={CheckCircle2}>
              <div className="flex flex-wrap gap-2">
                {rental.amenities.map((a) => (
                  <span key={a} className="flex items-center gap-1.5 text-sm bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full px-3 py-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />{a}
                  </span>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Rules */}
          <SectionCard title="Rules & Preferences" icon={ShieldCheck}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <RuleChip label="Students"           allowed={rental.studentsAllowed  ?? true} />
              <RuleChip label="Working Professionals" allowed={!!(rental.workingProfOnly)} />
              <RuleChip label="Couples"            allowed={rental.couplesAllowed   ?? false} />
              <RuleChip label="Families"           allowed={rental.familiesAllowed  ?? true} />
              <RuleChip label="Pets"               allowed={rental.petsAllowed      ?? false} />
              <RuleChip label="Visitors"           allowed={rental.visitorsAllowed  ?? true} />
              <RuleChip label="Non-Veg Cooking"    allowed={rental.nonVegAllowed    ?? true} />
              <RuleChip label="Vegetarian Only"    allowed={rental.vegetarianOnly   ?? false} />
              <RuleChip label="Smoking"            allowed={rental.smokingAllowed   ?? false} />
              <RuleChip label="Alcohol"            allowed={rental.alcoholAllowed   ?? false} />
            </div>
          </SectionCard>

        </div>

        {/* ── Right sidebar ────────────────────────────────────────── */}
        <div className="space-y-4 lg:sticky lg:top-8">

          {/* Price card */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(rental.rent)}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                {rental.deposit && <p className="text-xs text-muted-foreground mt-0.5">Deposit: {formatCurrency(rental.deposit)}</p>}
              </div>
              <Badge variant="outline" className={typeColor}>{rental.type}</Badge>
            </div>
            {rental.brokerage && rental.brokerage !== "NONE" && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                <Info className="h-3 w-3" /> Brokerage: {BROKERAGE_LABEL[rental.brokerage]}
              </p>
            )}
            {rental.brokerage === "NONE" && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Zero brokerage
              </p>
            )}
          </div>

          {/* Posted by */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Posted by</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 ring-2 ring-border">
                <AvatarImage src={rental.user.avatarUrl ?? rental.user.image ?? ""} />
                <AvatarFallback className="font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                  {getInitials(rental.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{rental.user.name}</p>
                {rental.user.company && <p className="text-xs text-muted-foreground">{rental.user.company.name}</p>}
                {rental.user.jobTitle && <p className="text-xs text-muted-foreground">{rental.user.jobTitle}</p>}
                {rental.user.isVerified && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </p>
                )}
              </div>
            </div>

            {isOwner && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                {rental.phone && (
                  <a href={`tel:${rental.phone}`} className="flex items-center gap-2 text-sm text-foreground hover:text-primary-600 transition-colors">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />{rental.phone}
                  </a>
                )}
                <Button size="sm" variant="outline" className="w-full mt-2 gap-2" asChild>
                  <Link href={`/messages/${rental.userId}`}>
                    <MessageSquare className="h-3.5 w-3.5" /> View messages
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Owner: leads panel */}
          {isOwner && (
            <RentalInquiryPanel
              rentalId={params.id}
              inquiries={rental.inquiries as any}
              isFilled={isFilled}
            />
          )}

          {/* Viewer: engage panel */}
          {!isOwner && !isFilled && !isExpired && (
            <RentalEngagePanel
              rentalId={params.id}
              myEngagement={myEngagement as any}
              ownerName={rental.user.name ?? "Owner"}
              ownerAvatar={rental.user.avatarUrl ?? rental.user.image}
            />
          )}

          {/* Contact unlocked (confirmed visit or accepted) */}
          {!isOwner && (isAccepted || isConfirmed) && (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner contact</p>
              {rental.phone && (
                <a href={`tel:${rental.phone}`} className="flex items-center gap-2 text-sm hover:text-primary-600 transition-colors">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />{rental.phone}
                </a>
              )}
              {rental.user.phone && rental.user.phone !== rental.phone && (
                <a href={`tel:${rental.user.phone}`} className="flex items-center gap-2 text-sm hover:text-primary-600 transition-colors">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />{rental.user.phone}
                </a>
              )}
              {rental.user.email && (
                <a href={`mailto:${rental.user.email}`} className="flex items-center gap-2 text-sm hover:text-primary-600 transition-colors">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />{rental.user.email}
                </a>
              )}
              <Button size="sm" variant="outline" className="w-full gap-2 mt-1" asChild>
                <Link href={`/messages/${rental.userId}`}>
                  <MessageSquare className="h-3.5 w-3.5" /> Message owner
                </Link>
              </Button>
            </div>
          )}

          {/* Filled / expired state for viewers */}
          {!isOwner && (isFilled || isExpired) && !myEngagement && (
            <div className="bg-muted/50 border border-border rounded-2xl p-5 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                This listing is {isFilled ? "filled" : "expired"}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
