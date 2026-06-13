import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { Suspense } from "react"
import { Plus, Building2, Clock, Crown, Briefcase, MapPin, MonitorSmartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { PremiumBadge, PremiumStrip } from "@/components/shared/PremiumBadge"
import { ReferralSearchBar } from "@/components/referrals/ReferralSearchBar"
import { formatRelativeTime } from "@/lib/utils"
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
    q?:      string
    dept?:   string
    mode?:   string
    type?:   string
    bonus?:  string
    minExp?: string
    maxExp?: string
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
  const session = await auth()
  const myId    = session?.user?.id

  // Build Prisma filters
  const deptFilter  = searchParams.dept  ? searchParams.dept.split(",").filter(Boolean)  : []
  const modeFilter  = searchParams.mode  ? searchParams.mode.split(",").filter(Boolean)  : []
  const typeFilter  = searchParams.type  ? searchParams.type.split(",").filter(Boolean)  : []
  const hasBonus    = searchParams.bonus === "1"
  const minExp      = searchParams.minExp ? Number(searchParams.minExp) : undefined
  const maxExp      = searchParams.maxExp ? Number(searchParams.maxExp) : undefined
  const query       = searchParams.q?.trim()

  const hasFilters  = !!(query || deptFilter.length || modeFilter.length || typeFilter.length || hasBonus || minExp !== undefined || maxExp !== undefined)

  const referrals = await prisma.jobReferral.findMany({
    where: {
      status: "OPEN",
      ...(deptFilter.length  ? { department: { in: deptFilter } }         : {}),
      ...(modeFilter.length  ? { workMode:   { in: modeFilter } }         : {}),
      ...(typeFilter.length  ? { jobType:    { in: typeFilter } }         : {}),
      ...(hasBonus           ? { referralBonus: { gt: 0 } }               : {}),
      ...(minExp !== undefined ? { experienceMax: { gte: minExp } }       : {}),
      ...(maxExp !== undefined ? { experienceMin: { lte: maxExp } }       : {}),
      ...(query ? {
        OR: [
          { title:       { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { department:  { contains: query, mode: "insensitive" } },
          { company:     { name: { contains: query, mode: "insensitive" } } },
        ],
      } : {}),
    },
    orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
    take:    hasFilters ? 100 : 40,
    include: {
      user:    { include: { company: { select: { name: true, logo: true, domain: true } } } },
      company: true,
      _count:  { select: { applications: true } },
    },
  })

  const boostedCount = referrals.filter((r) => r.isBoosted).length

  // Build active filter summary
  const filterParts: string[] = []
  if (query)             filterParts.push(`"${query}"`)
  if (deptFilter.length) filterParts.push(deptFilter.join(", "))
  if (modeFilter.length) filterParts.push(modeFilter.map((m) => WORK_MODE_LABELS[m] ?? m).join(", "))
  if (typeFilter.length) filterParts.push(typeFilter.map((t) => JOB_TYPE_LABELS[t] ?? t).join(", "))
  if (hasBonus)          filterParts.push("Has bonus")
  if (minExp !== undefined || maxExp !== undefined)
    filterParts.push(`${minExp ?? 0}–${maxExp ?? "∞"} yrs exp`)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Job Referrals</h1>
          <p className="text-muted-foreground text-sm mt-1">Get referrals from verified colleagues</p>
        </div>
        <Button asChild><Link href="/referrals/new"><Plus className="h-4 w-4" /> Post Referral</Link></Button>
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
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Premium Referrals — shown first
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
                      <div className="text-right shrink-0">
                        <Badge variant="success">Open</Badge>
                        {ref._count.applications > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{ref._count.applications} applicant{ref._count.applications !== 1 ? "s" : ""}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                          <Clock className="h-3 w-3" /> {formatRelativeTime(ref.createdAt)}
                        </p>
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
