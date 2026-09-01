import type { Metadata } from "next"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
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
import { PageHero } from "@/components/shared/PageHero"
import { CategoryStrip } from "@/components/shared/CategoryStrip"
import { formatRelativeTime } from "@/lib/utils"
import { deleteExpiredReferrals } from "@/lib/referrals"
import { fuzzyIncludes } from "@/lib/fuzzy"
import Image from "next/image"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Job Referrals",
  description: "Get your resume in front of an employee already on the inside — job referrals from verified colleagues on Korpo.",
}

const WORK_MODE_LABELS: Record<string, string> = {
  REMOTE: "Remote", HYBRID: "Hybrid", ONSITE: "On-site",
}
const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: "Full-time", PART_TIME: "Part-time", CONTRACT: "Contract", INTERNSHIP: "Internship",
}

const DEPARTMENT_ICONS: Record<string, string> = {
  Engineering: "Cpu", Data: "Database", Product: "LayoutDashboard", Design: "Palette",
  Marketing: "Megaphone", Sales: "TrendingUp", Finance: "Briefcase", HR: "Users", Legal: "Scale",
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
  await deleteExpiredReferrals()

  const session   = await auth()
  const myId      = session?.user?.id
  const isPremium = session?.user?.membershipPlan === "PREMIUM"
  // myReferralsCount/openCount/hiringCompanies-count folded into one round
  // trip (was: a sequential await before the Promise.all, plus a
  // findMany-just-for-.length inside it — 3 avoidable round trips). groupBy
  // stays separate since it returns a multi-row shape.
  const statsQuery = prisma.$queryRaw<Array<{
    myReferralsCount: bigint; openCount: bigint; hiringCompanies: bigint
  }>>(Prisma.sql`
    SELECT
      (SELECT COUNT(*) FROM "JobReferral" WHERE "userId" = ${myId ?? ""} AND status = 'OPEN') AS "myReferralsCount",
      (SELECT COUNT(*) FROM "JobReferral" WHERE status = 'OPEN') AS "openCount",
      (SELECT COUNT(DISTINCT "companyId") FROM "JobReferral" WHERE status = 'OPEN') AS "hiringCompanies"
  `).then(([r]) => ({
    myReferralsCount: Number(r.myReferralsCount),
    openCount: Number(r.openCount),
    hiringCompanies: Number(r.hiringCompanies),
  }))

  const [stats, deptCountRows] = await Promise.all([
    statsQuery,
    prisma.jobReferral.groupBy({ by: ["department"], where: { status: "OPEN" }, _count: true }),
  ])
  const myReferralsCount = myId && !isPremium ? stats.myReferralsCount : 0
  const { openCount, hiringCompanies } = stats
  const deptCounts = Object.fromEntries(deptCountRows.map((r) => [r.department, r._count]))

  // Build Prisma filters
  const deptFilter     = searchParams.dept    ? searchParams.dept.split(",").filter(Boolean)    : []
  const cityFilter     = searchParams.city    ? searchParams.city.split(",").filter(Boolean)    : []
  // Listings show across all locations by default; the city filter only
  // scopes results when the user explicitly picks one or more cities.
  const effectiveCityFilter = cityFilter
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
    ...(effectiveCityFilter.length ? { location: { in: effectiveCityFilter } } : {}),
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
    <div className="min-h-full bg-background">
      <PageHero
        imageUrl="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1920&q=85&auto=format&fit=crop"
        eyebrow="Corporate Referrals"
        titleWhite="Job"
        titleAccent="Referrals"
        description="Get referred by verified colleagues at top companies."
        overlayFrom="from-sky-950/50" overlayTo="to-indigo-950/40"
        blobFrom="bg-sky-500/30" blobTo="bg-indigo-400/20"
        eyebrowGradient="from-sky-500/30 via-blue-500/30 to-indigo-400/30"
        ctaGradient="from-sky-500 via-blue-500 to-indigo-400"
        focusRing="focus:ring-sky-400/50"
        stats={[
          { value: openCount.toLocaleString(), label: "Open Referrals", gradient: "from-sky-300 to-blue-200" },
          { value: hiringCompanies.toLocaleString(), label: "Companies Hiring", gradient: "from-indigo-300 to-violet-200" },
          { value: "100%", label: "Verified", gradient: "from-fuchsia-300 to-pink-200" },
        ]}
        primaryCta={{ href: "/referrals/new", label: "Post Referral", icon: Plus }}
        searchAction="/referrals"
        searchPlaceholder="Search roles, companies, departments…"
        defaultQuery={searchParams.q ?? ""}
      />
      <CategoryStrip
        activeValue={deptFilter[0] ?? "All"}
        basePath="/referrals"
        paramName="dept"
        ringClass="ring-sky-400"
        glowShadow="shadow-[0_0_12px_rgba(56,189,248,0.4)]"
        underlineGradient="from-sky-500 to-indigo-400"
        items={[
          { value: "All", label: "All", icon: "LayoutDashboard", iconBg: "bg-slate-100 dark:bg-white/10", iconColor: "text-slate-600 dark:text-white", count: openCount },
          ...Object.entries(DEPARTMENT_ICONS).map(([dept, icon]) => ({
            value: dept,
            label: dept,
            icon,
            iconBg: "bg-sky-100 dark:bg-sky-500/20",
            iconColor: "text-sky-600 dark:text-sky-400",
            count: deptCounts[dept] ?? 0,
          })),
        ]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!isPremium && myId && (
        <div className="flex justify-end mb-4">
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
            <span className="text-amber-700 dark:text-amber-300 font-medium">{myReferralsCount}/{FREE_LIMITS.referrals} posted</span>
            <Link href="/membership" className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold hover:underline"><Zap className="h-3 w-3" />Upgrade</Link>
          </div>
        </div>
      )}

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
          <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {referrals.map((ref) => {
            const isBoosted = ref.isBoosted
            const isOwn     = myId === ref.userId
            const hasApplied = myAppliedIds.has(ref.id)
            return (
              <Link key={ref.id} href={`/referrals/${ref.id}`} className="group flex flex-col">
                <div className={`bg-card border-2 rounded-3xl overflow-hidden flex flex-col h-full transition-all duration-200 hover:-translate-y-1 ${
                  isOwn
                    ? "border-violet-300 dark:border-violet-700 hover:shadow-[0_12px_36px_rgba(139,92,246,0.18)]"
                    : isBoosted
                      ? "border-amber-300 dark:border-amber-700 hover:shadow-[0_12px_36px_rgba(245,158,11,0.18)]"
                      : "border-border hover:border-sky-400/60 hover:shadow-[0_12px_36px_rgba(56,189,248,0.15)]"
                }`}>
                  {isOwn && (
                    <div className="bg-violet-600 text-white text-[11px] font-semibold px-4 py-1.5 flex items-center gap-1.5">
                      <Briefcase className="h-3 w-3" /> Posted by you
                    </div>
                  )}
                  {!isOwn && isBoosted && <PremiumStrip />}

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${
                        isOwn ? "ring-2 ring-violet-400 dark:ring-violet-600 bg-muted" : isBoosted ? "ring-2 ring-amber-300 dark:ring-amber-600 bg-muted" : "bg-muted"
                      }`}>
                        {ref.company.logo ? (
                          <Image src={ref.company.logo} alt={ref.company.name} width={48} height={48} className="object-contain" />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {hasApplied && <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 text-[10px]">Applied</Badge>}
                        {!isOwn && isBoosted && <PremiumBadge variant="boosted" />}
                      </div>
                    </div>

                    <h3 className={`font-semibold text-base leading-snug mt-3 transition-colors ${
                      isOwn ? "group-hover:text-violet-600 dark:group-hover:text-violet-400"
                      : isBoosted ? "group-hover:text-amber-600 dark:group-hover:text-amber-400"
                      : "group-hover:text-sky-600 dark:group-hover:text-sky-400"
                    }`}>
                      {ref.title}
                    </h3>
                    <p className="text-sm text-muted-foreground font-medium mt-0.5">{ref.company.name} · {ref.department}</p>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{ref.description}</p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <Badge variant="secondary" className="text-[11px]">{ref.experienceMin}–{ref.experienceMax} yrs</Badge>
                      {ref.referralBonus && <Badge variant="warning" className="text-[11px]">₹{ref.referralBonus.toLocaleString()} bonus</Badge>}
                      {ref.workMode && (
                        <Badge variant="outline" className="text-[11px] flex items-center gap-1">
                          <MonitorSmartphone className="h-2.5 w-2.5" />
                          {WORK_MODE_LABELS[ref.workMode] ?? ref.workMode}
                        </Badge>
                      )}
                      {ref.jobType && (
                        <Badge variant="outline" className="text-[11px]">{JOB_TYPE_LABELS[ref.jobType] ?? ref.jobType}</Badge>
                      )}
                    </div>

                    {ref.location && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                        <MapPin className="h-3 w-3" />{ref.location}
                      </span>
                    )}

                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between border-t border-border pt-3">
                        <UserCard user={ref.user} size="sm" clickable={false} />
                        <SocialShare
                          title={`${ref.title} at ${ref.company.name} — Referral on Korpo`}
                          path={`/referrals/${ref.id}`}
                          variant="icon"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="success" className="text-[11px]">Open</Badge>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatRelativeTime(ref.createdAt)}
                          {ref._count.applications > 0 && ` · ${ref._count.applications} applicant${ref._count.applications !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      </div>
    </div>
  )
}
