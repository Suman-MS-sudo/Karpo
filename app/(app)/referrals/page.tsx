import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { Suspense } from "react"
import { Plus, Building2, Clock, Briefcase, MapPin, MonitorSmartphone, Zap } from "lucide-react"
import { FREE_LIMITS } from "@/lib/limits"
import { SocialShare } from "@/components/shared/SocialShare"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { PremiumBadge, PremiumStrip } from "@/components/shared/PremiumBadge"
import { ReferralSearchBar } from "@/components/referrals/ReferralSearchBar"
import { formatRelativeTime } from "@/lib/utils"
import { fuzzyIncludes } from "@/lib/fuzzy"
import Image from "next/image"

export const dynamic = "force-dynamic"

const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site",
}
const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship",
}

interface Props {
  searchParams: {
    q?:       string
    company?: string
    dept?:    string
    city?:    string
    mode?:    string
    type?:    string
    minExp?:  string
    maxExp?:  string
    minSal?:  string
    maxSal?:  string
  }
}

function SearchBarWrapper() {
  return (
    <Suspense>
      <ReferralSearchBar />
    </Suspense>
  )
}

export default async function ReferralsPage({ searchParams }: Props) {
  const session   = await auth()
  const myId      = session?.user?.id
  const isPremium = session?.user?.membershipPlan === "PREMIUM"
  const myReferralsCount = myId && !isPremium
    ? await prisma.jobReferral.count({ where: { userId: myId, status: "OPEN" } })
    : 0

  // Build Prisma filters
  const deptFilter     = searchParams.dept    ? searchParams.dept.split(",").filter(Boolean)    : []
  const cityFilter     = searchParams.city    ? searchParams.city.split(",").filter(Boolean)    : []
  const modeFilter     = searchParams.mode    ? searchParams.mode.split(",").filter(Boolean)    : []
  const typeFilter     = searchParams.type    ? searchParams.type.split(",").filter(Boolean)    : []
  const companyQuery   = searchParams.company?.trim()
  const minExp         = searchParams.minExp ? Number(searchParams.minExp) : undefined
  const maxExp         = searchParams.maxExp ? Number(searchParams.maxExp) : undefined
  const minSal         = searchParams.minSal ? Number(searchParams.minSal) : undefined
  const maxSal         = searchParams.maxSal ? Number(searchParams.maxSal) : undefined
  const query          = searchParams.q?.trim()

  const hasFilters = !!(
    query || companyQuery || deptFilter.length || cityFilter.length ||
    modeFilter.length || typeFilter.length ||
    minExp !== undefined || maxExp !== undefined ||
    minSal !== undefined || maxSal !== undefined
  )

  // Non-text filters only — company/title text matching is handled separately
  // below so both get an exact-first, fuzzy-fallback (typo-tolerant) pass.
  const baseWhere = {
    status: "OPEN" as const,
    ...(deptFilter.length    ? { department: { in: deptFilter } }                           : {}),
    ...(modeFilter.length    ? { workMode:   { in: modeFilter } }                           : {}),
    ...(typeFilter.length    ? { jobType:    { in: typeFilter } }                           : {}),
    ...(cityFilter.length    ? { location:   { in: cityFilter } }      : {}),
    ...(minExp !== undefined ? { experienceMax: { gte: minExp } }                           : {}),
    ...(maxExp !== undefined ? { experienceMin: { lte: maxExp } }                           : {}),
    ...(minSal !== undefined ? { salaryMax: { gte: minSal } }                               : {}),
    ...(maxSal !== undefined ? { salaryMin: { lte: maxSal } }                               : {}),
  }

  const includeArgs = {
    user:    { include: { company: { select: { name: true, logo: true, domain: true } } } },
    company: true,
    _count:  { select: { applications: true } },
  } as const

  const take = hasFilters ? 100 : 40
  const hasTextSearch = !!(query || companyQuery)

  let referrals
  if (hasTextSearch) {
    // Exact substring match first; if a typo yields nothing, fall back to a
    // fuzzy (typo-tolerant, spell-correcting) match over a bounded candidate
    // pool — same approach used for Rentals search, extended to also cover
    // the dedicated company filter.
    const exactAnd: Record<string, unknown>[] = []
    if (query)        exactAnd.push({ OR: [
      { title:       { contains: query } },
      { description: { contains: query } },
      { department:  { contains: query } },
      { company:     { name: { contains: query } } },
    ] })
    if (companyQuery) exactAnd.push({ company: { name: { contains: companyQuery } } })

    referrals = await prisma.jobReferral.findMany({
      where: { ...baseWhere, AND: exactAnd },
      orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
      take,
      include: includeArgs,
    })
    if (referrals.length === 0) {
      const candidates = await prisma.jobReferral.findMany({
        where: baseWhere,
        orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
        take: 500,
        include: includeArgs,
      })
      referrals = candidates.filter((r) => {
        const matchesQuery   = !query        || fuzzyIncludes([r.title, r.description, r.department, r.company.name].filter(Boolean).join(" "), query)
        const matchesCompany = !companyQuery || fuzzyIncludes([r.company.name, r.company.domain].filter(Boolean).join(" "), companyQuery)
        return matchesQuery && matchesCompany
      }).slice(0, take)
    }
  } else {
    referrals = await prisma.jobReferral.findMany({
      where: baseWhere,
      orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
      take,
      include: includeArgs,
    })
  }

  const myAppliedIds = myId
    ? new Set(
        (await prisma.referralApplication.findMany({
          where:  { userId: myId, referralId: { in: referrals.map((r) => r.id) } },
          select: { referralId: true },
        })).map((a) => a.referralId)
      )
    : new Set<string>()

  const boostedCount = referrals.filter((r) => r.isBoosted).length

  // Build active filter summary
  const filterParts: string[] = []
  if (query)              filterParts.push(`"${query}"`)
  if (companyQuery)       filterParts.push(companyQuery)
  if (cityFilter.length)  filterParts.push(cityFilter.join(", "))
  if (deptFilter.length)  filterParts.push(deptFilter.join(", "))
  if (modeFilter.length)  filterParts.push(modeFilter.map((m) => WORK_MODE_LABELS[m] ?? m).join(", "))
  if (typeFilter.length)  filterParts.push(typeFilter.map((t) => JOB_TYPE_LABELS[t] ?? t).join(", "))
  if (minExp !== undefined || maxExp !== undefined)
    filterParts.push(`${minExp ?? 0}–${maxExp ?? "∞"} yrs exp`)
  if (minSal !== undefined || maxSal !== undefined)
    filterParts.push(`${minSal ?? 0}–${maxSal ?? "∞"} LPA`)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Job Referrals</h1>
          <p className="text-muted-foreground text-sm mt-1">Get referrals from verified colleagues</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isPremium && myId && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">{myReferralsCount}/{FREE_LIMITS.referrals} posted</span>
              <Link href="/membership" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline"><Zap className="h-3 w-3" />Upgrade</Link>
            </div>
          )}
          <Button asChild><Link href="/referrals/new"><Plus className="h-4 w-4" /> Post Referral</Link></Button>
        </div>
      </div>

      <SearchBarWrapper />

      {/* Filter summary */}
      {hasFilters && (
        <p className="text-sm text-muted-foreground mb-4">
          {referrals.length} result{referrals.length !== 1 ? "s" : ""} for {filterParts.join(" · ")}
        </p>
      )}

      {!hasFilters && boostedCount > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Boosted referrals — shown first
          </span>
        </div>
      )}

      {referrals.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">💼</p>
          <h3 className="text-lg font-semibold mb-2">{hasFilters ? "No referrals match your filters" : "No referrals posted yet"}</h3>
          <p className="text-muted-foreground mb-6">
            {hasFilters ? "Try adjusting your filters or clearing them." : "Be the first to post a referral opportunity!"}
          </p>
          {hasFilters
            ? <Button variant="outline" asChild><Link href="/referrals">Clear filters</Link></Button>
            : <Button asChild><Link href="/referrals/new">Post First Referral</Link></Button>
          }
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map((ref) => {
            const isBoosted = ref.isBoosted
            const isOwn     = myId === ref.userId
            const hasApplied = myAppliedIds.has(ref.id)
            return (
              <Link key={ref.id} href={`/referrals/${ref.id}`} className="block group">
                <div className={`bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all ${
                  isOwn
                    ? "border-violet-400 dark:border-violet-600 shadow-sm shadow-violet-100 dark:shadow-violet-900/20 ring-1 ring-violet-200 dark:ring-violet-800"
                    : isBoosted
                      ? "border-amber-300 dark:border-amber-700 shadow-sm shadow-amber-100 dark:shadow-amber-900/20"
                      : "border-border border-l-4 border-l-violet-400"
                }`}>
                  {isOwn && (
                    <div className="bg-violet-600 text-white text-[11px] font-semibold px-4 py-1 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> Posted by you
                    </div>
                  )}
                  {!isOwn && isBoosted && <PremiumStrip />}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${
                          isOwn ? "ring-2 ring-violet-400 dark:ring-violet-600 bg-muted" : isBoosted ? "ring-2 ring-amber-300 dark:ring-amber-600 bg-muted" : "bg-muted"
                        }`}>
                          {ref.company.logo ? (
                            <Image src={ref.company.logo} alt={ref.company.name} width={48} height={48} className="object-contain" />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                            {!isOwn && isBoosted && <PremiumBadge variant="boosted" />}
                          </div>
                          <h3 className={`font-semibold text-lg transition-colors ${
                            isOwn ? "group-hover:text-violet-600 dark:group-hover:text-violet-400"
                            : isBoosted ? "group-hover:text-amber-600 dark:group-hover:text-amber-400"
                            : "group-hover:text-accent-400"
                          }`}>
                            {ref.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-muted-foreground text-sm font-medium">{ref.company.name}</span>
                            <span className="text-muted-foreground text-sm">· {ref.department}</span>
                            <Badge variant="secondary" className="text-xs">{ref.experienceMin}–{ref.experienceMax} yrs</Badge>
                            {ref.referralBonus && <Badge variant="warning" className="text-xs">₹{ref.referralBonus.toLocaleString()} bonus</Badge>}
                            {ref.workMode && (
                              <Badge variant="outline" className="text-xs flex items-center gap-1">
                                <MonitorSmartphone className="h-2.5 w-2.5" />
                                {WORK_MODE_LABELS[ref.workMode] ?? ref.workMode}
                              </Badge>
                            )}
                            {ref.jobType && (
                              <Badge variant="outline" className="text-xs">{JOB_TYPE_LABELS[ref.jobType] ?? ref.jobType}</Badge>
                            )}
                            {ref.location && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{ref.location}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{ref.description}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        {hasApplied && <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300">Applied</Badge>}
                        <Badge variant="success">Open</Badge>
                        {ref._count.applications > 0 && (
                          <p className="text-xs text-muted-foreground">{ref._count.applications} applicant{ref._count.applications !== 1 ? "s" : ""}</p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" /> {formatRelativeTime(ref.createdAt)}
                        </p>
                        <SocialShare
                          title={`${ref.title} at ${ref.company.name} — Referral on Korpo`}
                          path={`/referrals/${ref.id}`}
                          variant="icon"
                        />
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border">
                      <UserCard user={ref.user} size="sm" clickable={false} />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
