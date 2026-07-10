import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import {
  Plus, MapPin, Calendar, ChevronLeft, ChevronRight,
  Wifi, Car, Dumbbell, Shield, Utensils, Zap, Home,
  BedDouble, Bath, SlidersHorizontal,
} from "lucide-react"
import { FREE_LIMITS } from "@/lib/limits"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PremiumBadge, PremiumStrip } from "@/components/shared/PremiumBadge"
import { SocialShare } from "@/components/shared/SocialShare"
import { formatCurrency, formatRelativeTime, getInitials } from "@/lib/utils"
import { RentalCityFilter } from "@/components/rentals/RentalCityFilter"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 18

const TYPES = [
  { value: "",          label: "All Types",  count: null },
  { value: "APARTMENT", label: "Apartment"              },
  { value: "ROOM",      label: "Room"                   },
  { value: "PG",        label: "PG"                     },
  { value: "FLATMATE",  label: "Flatmate"               },
  { value: "STUDIO",    label: "Studio"                 },
  { value: "VILLA",     label: "Villa"                  },
]

const FURNISHED_OPTS = [
  { value: "",           label: "Any"          },
  { value: "FULLY",      label: "Fully Furnished" },
  { value: "SEMI",       label: "Semi Furnished"  },
  { value: "UNFURNISHED",label: "Unfurnished"     },
]

const GENDER_OPTS = [
  { value: "",       label: "Any Gender"  },
  { value: "MALE",   label: "Male Only"   },
  { value: "FEMALE", label: "Female Only" },
]

const BHK_OPTS = ["1BHK", "2BHK", "3BHK", "4BHK+", "Studio", "Room", "PG Room"]

const RENT_RANGES = [
  { value: "",           label: "Any Budget"    },
  { value: "0-10000",    label: "Under ₹10k"   },
  { value: "10000-20000",label: "₹10k–₹20k"   },
  { value: "20000-35000",label: "₹20k–₹35k"   },
  { value: "35000-",     label: "₹35k+"        },
]

const AMENITY_ICONS: Record<string, React.ComponentType<{className?: string}>> = {
  WiFi: Wifi, Parking: Car, Gym: Dumbbell, Security: Shield,
  Meals: Utensils, "Power Backup": Zap,
}

const TYPE_COLOR: Record<string, string> = {
  APARTMENT: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  ROOM:      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  PG:        "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  FLATMATE:  "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  STUDIO:    "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  VILLA:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
}

interface PageProps {
  searchParams: {
    type?: string; city?: string; furnished?: string; bhk?: string
    minRent?: string; maxRent?: string; gender?: string; page?: string; budget?: string
  }
}

function buildUrl(base: Record<string, string | undefined>, override: Record<string, string | undefined>) {
  const p = new URLSearchParams()
  const merged = { ...base, ...override }
  for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v)
  const s = p.toString()
  return `/rentals${s ? `?${s}` : ""}`
}

function Pill({
  active, href, children,
}: { active: boolean; href: string; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all whitespace-nowrap ${
        active
          ? "bg-primary-600 text-white border-primary-600 shadow-sm"
          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground bg-background"
      }`}>{children}</span>
    </Link>
  )
}

export default async function RentalsPage({ searchParams }: PageProps) {
  const session = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"
  const userCity = session?.user?.city
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))
  const myRentalsCount = session?.user?.id && !isPremium
    ? await prisma.rentalPost.count({ where: { userId: session.user.id, status: "ACTIVE" } })
    : 0

  // budget param maps to minRent/maxRent
  const [budgetMin, budgetMax] = (() => {
    const b = searchParams.budget ?? ""
    if (!b) return [undefined, undefined]
    const [min, max] = b.split("-")
    return [min || undefined, max || undefined]
  })()

  const where = {
    status: "ACTIVE",
    ...(searchParams.type ? { type: searchParams.type } : {}),
    ...(searchParams.city ? { city: searchParams.city } : {}),
    ...(searchParams.furnished ? { furnished: searchParams.furnished } : {}),
    ...(searchParams.bhk       ? { bhk:       searchParams.bhk }       : {}),
    ...(searchParams.gender    ? { gender:    searchParams.gender }     : {}),
    ...((budgetMin || budgetMax) ? {
      rent: {
        ...(budgetMin ? { gte: parseInt(budgetMin) } : {}),
        ...(budgetMax ? { lte: parseInt(budgetMax) } : {}),
      },
    } : {}),
  }

  const [rentals, total] = await Promise.all([
    prisma.rentalPost.findMany({
      where,
      orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { include: { company: { select: { name: true, logo: true, domain: true } } } },
      },
    }),
    prisma.rentalPost.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE_SIZE)
  const sp = {
    type: searchParams.type,
    city: searchParams.city,
    furnished: searchParams.furnished,
    bhk: searchParams.bhk,
    gender: searchParams.gender,
    budget: searchParams.budget,
  }

  const activeType      = searchParams.type      ?? ""
  const activeFurnished = searchParams.furnished  ?? ""
  const activeGender    = searchParams.gender     ?? ""
  const activeBhk       = searchParams.bhk        ?? ""
  const activeBudget    = searchParams.budget      ?? ""

  const activeCity = searchParams.city ?? ""
  const hasActiveFilters = !!(activeCity || activeFurnished || activeGender || activeBhk || activeBudget)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rental &amp; Flatmate Hub</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {total} listing{total !== 1 ? "s" : ""}
            {searchParams.city ? ` in ${searchParams.city}` : " across all cities"}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isPremium && session?.user?.id && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">{myRentalsCount}/{FREE_LIMITS.rentals} posted</span>
              <Link href="/membership" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline"><Zap className="h-3 w-3" />Upgrade</Link>
            </div>
          )}
          <Button asChild>
            <Link href="/rentals/new"><Plus className="h-4 w-4 mr-1" />Post Listing</Link>
          </Button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">

        {/* Type tab bar */}
        <div className="flex items-center border-b border-border overflow-x-auto scrollbar-hide">
          {TYPES.map((t) => {
            const active = activeType === t.value
            return (
              <Link
                key={t.value}
                href={buildUrl(sp, { type: t.value || undefined, page: undefined })}
                className={`relative shrink-0 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  active
                    ? "border-primary-600 text-primary-600 dark:text-primary-400"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                {t.label}
              </Link>
            )
          })}
        </div>

        {/* Filter rows */}
        <div className="p-4 space-y-3">

          {/* Row 0: City */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-20">
              City
            </span>
            <RentalCityFilter activeCity={activeCity ?? ""} />
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Row 1: Furnishing + Gender */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Furnishing */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-20">
                Furnishing
              </span>
              <div className="flex flex-wrap gap-1.5">
                {FURNISHED_OPTS.map((f) => (
                  <Pill
                    key={f.value}
                    href={buildUrl(sp, { furnished: f.value || undefined, page: undefined })}
                    active={activeFurnished === f.value}
                  >
                    {f.label}
                  </Pill>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden sm:block h-5 w-px bg-border" />

            {/* Gender */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-14">
                Gender
              </span>
              <div className="flex flex-wrap gap-1.5">
                {GENDER_OPTS.map((g) => (
                  <Pill
                    key={g.value}
                    href={buildUrl(sp, { gender: g.value || undefined, page: undefined })}
                    active={activeGender === g.value}
                  >
                    {g.label}
                  </Pill>
                ))}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Row 2: BHK + Budget */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* BHK */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-20">
                BHK / Size
              </span>
              <div className="flex flex-wrap gap-1.5">
                {BHK_OPTS.map((b) => (
                  <Pill
                    key={b}
                    href={buildUrl(sp, { bhk: activeBhk === b ? undefined : b, page: undefined })}
                    active={activeBhk === b}
                  >
                    {b}
                  </Pill>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden lg:block h-5 w-px bg-border" />

            {/* Budget */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider shrink-0 w-14">
                Budget
              </span>
              <div className="flex flex-wrap gap-1.5">
                {RENT_RANGES.map((r) => (
                  <Pill
                    key={r.value}
                    href={buildUrl(sp, { budget: r.value || undefined, page: undefined })}
                    active={activeBudget === r.value}
                  >
                    {r.label}
                  </Pill>
                ))}
              </div>
            </div>
          </div>

          {/* Active filter summary + clear */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <SlidersHorizontal className="h-3.5 w-3.5 text-primary-600" />
                <span className="text-xs text-primary-600 font-medium">Active filters:</span>
                {activeCity      && <span className="text-xs bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md">{activeCity}</span>}
                {activeFurnished && <span className="text-xs bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md">{FURNISHED_OPTS.find(f => f.value === activeFurnished)?.label}</span>}
                {activeGender    && <span className="text-xs bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md">{GENDER_OPTS.find(g => g.value === activeGender)?.label}</span>}
                {activeBhk       && <span className="text-xs bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md">{activeBhk}</span>}
                {activeBudget    && <span className="text-xs bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-md">{RENT_RANGES.find(r => r.value === activeBudget)?.label}</span>}
              </div>
              <Link
                href={buildUrl({ type: activeType || undefined }, {})}
                className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline transition-colors"
              >
                Clear all
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Premium listings label */}
      {rentals.some((r) => r.isBoosted) && (
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Boosted listings — shown first</span>
        </div>
      )}

      {/* Grid */}
      {rentals.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border rounded-2xl">
          <Home className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-muted-foreground">No listings found</h3>
          <p className="text-sm text-muted-foreground/70 mt-1 mb-5">Try adjusting your filters</p>
          <Button asChild size="sm"><Link href="/rentals/new">Post a Listing</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rentals.map((rental) => {
            const typeColor  = TYPE_COLOR[rental.type] ?? "bg-muted text-muted-foreground"
            const isBoosted  = rental.isBoosted
            return (
              <Link key={rental.id} href={`/rentals/${rental.id}`} className="group block">
                <div className={`bg-card border rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                  isBoosted
                    ? "border-amber-300 dark:border-amber-700 shadow-sm shadow-amber-100 dark:shadow-amber-900/20"
                    : "border-border"
                }`}>
                  {isBoosted && <PremiumStrip />}

                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-muted">
                    {rental.images[0] ? (
                      <Image src={rental.images[0]} alt={rental.title} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 33vw" />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <Home className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}
                    <span className={`absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${typeColor}`}>
                      {rental.type}
                    </span>
                    {rental.furnished !== "UNFURNISHED" && (
                      <span className="absolute top-2.5 right-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                        {rental.furnished === "FULLY" ? "Furnished" : "Semi"}
                      </span>
                    )}
                    {rental.images.length > 1 && (
                      <span className="absolute bottom-2 right-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                        +{rental.images.length - 1}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {isBoosted && <PremiumBadge variant="boosted" className="mb-1" />}
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2">{rental.title}</h3>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <p className={`font-bold text-sm ${isBoosted ? "text-amber-600 dark:text-amber-400" : "text-primary-600"}`}>{formatCurrency(rental.rent)}<span className="text-[10px] font-normal text-muted-foreground">/mo</span></p>
                        {rental.deposit && <p className="text-[10px] text-muted-foreground">+{formatCurrency(rental.deposit)} dep</p>}
                        <SocialShare
                          title={`${rental.title} — Rental on Korpo`}
                          path={`/rentals/${rental.id}`}
                          variant="icon"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{rental.area}, {rental.city}
                      </span>
                      {rental.bhk && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BedDouble className="h-3 w-3" />{rental.bhk}
                        </span>
                      )}
                      {rental.bathrooms && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Bath className="h-3 w-3" />{rental.bathrooms}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Available {new Date(rental.availableFrom) <= new Date() ? "now" : `from ${new Date(rental.availableFrom).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                    </div>

                    {rental.amenities.length > 0 && (
                      <div className="flex gap-1.5 mt-2.5 flex-wrap">
                        {rental.amenities.slice(0, 4).map((a) => {
                          const Icon = AMENITY_ICONS[a]
                          return Icon ? (
                            <span key={a} className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                              <Icon className="h-2.5 w-2.5" />{a}
                            </span>
                          ) : (
                            <span key={a} className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">{a}</span>
                          )
                        })}
                        {rental.amenities.length > 4 && <span className="text-[10px] text-muted-foreground">+{rental.amenities.length - 4}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={rental.user.avatarUrl ?? rental.user.image ?? ""} />
                          <AvatarFallback className="text-[8px] bg-primary-100 dark:bg-primary-900/40 text-primary-700">{getInitials(rental.user.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">{rental.user.name?.split(" ")[0]}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">{formatRelativeTime(rental.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Link href={buildUrl(sp, { page: page > 1 ? String(page - 1) : undefined })}>
            <Button variant="outline" size="sm" disabled={page === 1} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground px-2">Page {page} of {totalPages}</span>
          <Link href={buildUrl(sp, { page: page < totalPages ? String(page + 1) : undefined })}>
            <Button variant="outline" size="sm" disabled={page === totalPages} className="gap-1">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
