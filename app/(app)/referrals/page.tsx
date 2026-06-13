import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Plus, Building2, Clock, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserCard } from "@/components/shared/UserCard"
import { PremiumBadge, PremiumStrip } from "@/components/shared/PremiumBadge"
import { formatRelativeTime } from "@/lib/utils"
import Image from "next/image"

export const dynamic = "force-dynamic"

export default async function ReferralsPage() {
  const referrals = await prisma.jobReferral.findMany({
    where:   { status: "OPEN" },
    orderBy: [{ isBoosted: "desc" }, { createdAt: "desc" }],
    take:    40,
    include: {
      user:    { include: { company: { select: { name: true, logo: true, domain: true } } } },
      company: true,
      _count:  { select: { applications: true } },
    },
  })

  const boostedCount = referrals.filter((r) => r.isBoosted).length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Job Referrals</h1>
          <p className="text-muted-foreground text-sm mt-1">Get referrals from verified colleagues</p>
        </div>
        <Button asChild><Link href="/referrals/new"><Plus className="h-4 w-4" /> Post Referral</Link></Button>
      </div>

      {boostedCount > 0 && (
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
          <h3 className="text-lg font-semibold mb-2">No referrals posted yet</h3>
          <p className="text-muted-foreground mb-6">Be the first to post a referral opportunity!</p>
          <Button asChild><Link href="/referrals/new">Post First Referral</Link></Button>
        </div>
      ) : (
        <div className="space-y-4">
          {referrals.map((ref) => {
            const isBoosted = ref.isBoosted
            return (
              <Link key={ref.id} href={`/referrals/${ref.id}`} className="block group">
                <div className={`bg-card border rounded-xl overflow-hidden hover:shadow-md transition-all ${
                  isBoosted
                    ? "border-amber-300 dark:border-amber-700 shadow-sm shadow-amber-100 dark:shadow-amber-900/20"
                    : "border-border border-l-4 border-l-violet-400"
                }`}>
                  {isBoosted && <PremiumStrip />}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 overflow-hidden ${isBoosted ? "ring-2 ring-amber-300 dark:ring-amber-600 bg-muted" : "bg-muted"}`}>
                          {ref.company.logo ? (
                            <Image src={ref.company.logo} alt={ref.company.name} width={48} height={48} className="object-contain" />
                          ) : (
                            <Building2 className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            {isBoosted && <PremiumBadge variant="boosted" />}
                          </div>
                          <h3 className={`font-semibold text-lg transition-colors ${isBoosted ? "group-hover:text-amber-600 dark:group-hover:text-amber-400" : "group-hover:text-accent-400"}`}>
                            {ref.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-muted-foreground text-sm font-medium">{ref.company.name}</span>
                            <span className="text-muted-foreground text-sm">· {ref.department}</span>
                            <Badge variant="secondary" className="text-xs">{ref.experienceMin}–{ref.experienceMax} yrs</Badge>
                            {ref.referralBonus && <Badge variant="warning" className="text-xs">₹{ref.referralBonus.toLocaleString()} bonus</Badge>}
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
