import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, Building2, Clock, Briefcase, Users, GraduationCap,
  Gift, CalendarDays, CheckCircle2, XCircle, MapPin, Layers,
  Monitor, Laptop, Globe, Code2, ListChecks, Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { UserCard } from "@/components/shared/UserCard"
import { formatDate } from "@/lib/utils"
import { ReferralApplyPanel } from "@/components/referrals/ReferralApplyPanel"
import { ReferralApplicationsPanel } from "@/components/referrals/ReferralApplicationsPanel"

export const dynamic = "force-dynamic"

const JOB_TYPE_LABEL: Record<string, string> = {
  FULL_TIME: "Full-time", CONTRACT: "Contract",
  PART_TIME: "Part-time", INTERNSHIP: "Internship",
}
const WORK_MODE_LABEL: Record<string, { label: string; icon: any; color: string }> = {
  REMOTE:  { label: "Remote",  icon: Globe,   color: "text-emerald-600 dark:text-emerald-400" },
  HYBRID:  { label: "Hybrid",  icon: Laptop,  color: "text-blue-600 dark:text-blue-400" },
  ONSITE:  { label: "On-site", icon: Monitor, color: "text-violet-600 dark:text-violet-400" },
}

export default async function ReferralDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()

  const ref = await prisma.jobReferral.findUnique({
    where: { id: params.id },
    include: {
      user:    { include: { company: { select: { name: true, logo: true, domain: true } } } },
      company: true,
      _count:  { select: { applications: true } },
    },
  })

  if (!ref) notFound()

  const isOwner  = session?.user?.id === ref.userId
  const isClosed = ref.status !== "OPEN"

  const myApplication = session?.user?.id && !isOwner
    ? await prisma.referralApplication.findUnique({
        where:  { referralId_userId: { referralId: params.id, userId: session.user.id } },
        select: { id: true, type: true, status: true, coverLetter: true, linkedIn: true, resumeUrl: true, yearsExp: true, currentCompany: true, currentCtc: true, expectedCtc: true, noticePeriod: true },
      })
    : null

  const deadline  = ref.deadline ? new Date(ref.deadline) : null
  const isExpired = deadline ? deadline < new Date() : false
  const workMode  = ref.workMode ? WORK_MODE_LABEL[ref.workMode] : null
  const WorkModeIcon = workMode?.icon

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/referrals" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Referrals
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Main ──────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                {ref.company.logo
                  ? <Image src={ref.company.logo} alt={ref.company.name} width={64} height={64} className="object-contain" />
                  : <Building2 className="h-8 w-8 text-muted-foreground" />}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold leading-tight">{ref.title}</h1>
                <p className="text-base text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 shrink-0" />{ref.company.name}
                  {ref.location && <><span className="text-border">·</span><MapPin className="h-3.5 w-3.5 shrink-0" />{ref.location}</>}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {ref.jobType && <Badge variant="secondary">{JOB_TYPE_LABEL[ref.jobType] ?? ref.jobType}</Badge>}
                  {workMode && (
                    <Badge variant="outline" className={workMode.color}>
                      {WorkModeIcon && <WorkModeIcon className="h-3 w-3 mr-1" />}{workMode.label}
                    </Badge>
                  )}
                  <Badge variant="secondary"><Briefcase className="h-3 w-3 mr-1" />{ref.department}</Badge>
                  <Badge variant="secondary"><GraduationCap className="h-3 w-3 mr-1" />{ref.experienceMin}–{ref.experienceMax} yrs</Badge>
                  {isClosed
                    ? <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Closed</Badge>
                    : <Badge variant="success"><CheckCircle2 className="h-3 w-3 mr-1" />Open</Badge>}
                  {ref.referralBonus && (
                    <Badge variant="warning"><Gift className="h-3 w-3 mr-1" />₹{ref.referralBonus.toLocaleString()} bonus</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Key numbers bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ref.salaryMin && ref.salaryMax && (
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Salary (LPA)</p>
                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400">₹{ref.salaryMin}–{ref.salaryMax}L</p>
              </div>
            )}
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Openings</p>
              <p className="font-bold text-sm">{ref.openings}</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Applicants</p>
              <p className="font-bold text-sm">{ref._count.applications}</p>
            </div>
            {deadline && (
              <div className="bg-card border border-border rounded-xl p-3 text-center">
                <p className="text-xs text-muted-foreground mb-0.5">Deadline</p>
                <p className={`font-bold text-sm ${isExpired ? "text-red-500" : ""}`}>{formatDate(deadline)}</p>
              </div>
            )}
          </div>

          {/* Skills */}
          {ref.skills.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Code2 className="h-4 w-4 text-primary-600" />Required Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {ref.skills.map((s) => (
                  <span key={s} className="text-xs bg-primary-50 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-primary-600" />Job Description
            </h2>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {ref.description}
            </div>
          </div>

          {/* Interview process */}
          {ref.interviewProcess && (
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2 text-sm">
                <ListChecks className="h-4 w-4 text-primary-600" />Interview Process
              </h2>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {ref.interviewProcess}
              </div>
            </div>
          )}

          {/* Perks */}
          {ref.perks.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-amber-500" />Perks & Benefits
              </h2>
              <div className="flex flex-wrap gap-2">
                {ref.perks.map((p) => (
                  <span key={p} className="text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3" />{p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Company card */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4 text-sm">About {ref.company.name}</h2>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                {ref.company.logo
                  ? <Image src={ref.company.logo} alt={ref.company.name} width={48} height={48} className="object-contain" />
                  : <Building2 className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-semibold text-sm">{ref.company.name}</p>
                {ref.company.domain && (
                  <a href={`https://${ref.company.domain}`} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary-600 hover:underline">{ref.company.domain}</a>
                )}
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-5">
            <p className="font-semibold text-amber-800 dark:text-amber-300 mb-3 text-sm">How referrals work</p>
            <ol className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
              <li className="flex gap-2.5"><span className="font-bold shrink-0 mt-0.5">1.</span>Express interest or submit a full application</li>
              <li className="flex gap-2.5"><span className="font-bold shrink-0 mt-0.5">2.</span>The referrer reviews your profile and shortlists candidates</li>
              <li className="flex gap-2.5"><span className="font-bold shrink-0 mt-0.5">3.</span>If shortlisted, they formally refer you to {ref.company.name} internally</li>
              <li className="flex gap-2.5"><span className="font-bold shrink-0 mt-0.5">4.</span>The company contacts you directly for their interview process</li>
              {ref.referralBonus && <li className="flex gap-2.5"><span className="font-bold shrink-0 mt-0.5">5.</span>If hired, the referrer receives a ₹{ref.referralBonus.toLocaleString()} bonus</li>}
            </ol>
          </div>
        </div>

        {/* ── Sidebar ───────────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-5 sticky top-4">
            {/* Quick facts */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Facts</p>
              <div className="space-y-2.5">
                {ref.salaryMin && ref.salaryMax && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Salary</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{ref.salaryMin}–{ref.salaryMax} LPA</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{ref.department}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium">{ref.experienceMin}–{ref.experienceMax} years</span>
                </div>
                {ref.jobType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Job type</span>
                    <span className="font-medium">{JOB_TYPE_LABEL[ref.jobType] ?? ref.jobType}</span>
                  </div>
                )}
                {ref.workMode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Work mode</span>
                    <span className="font-medium">{WORK_MODE_LABEL[ref.workMode]?.label ?? ref.workMode}</span>
                  </div>
                )}
                {ref.location && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{ref.location}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Openings</span>
                  <span className="font-medium">{ref.openings}</span>
                </div>
                {ref.referralBonus && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Referral bonus</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">₹{ref.referralBonus.toLocaleString()}</span>
                  </div>
                )}
                {ref.internalCode && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Job code</span>
                    <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">{ref.internalCode}</span>
                  </div>
                )}
                {deadline && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deadline</span>
                    <span className={`font-medium ${isExpired ? "text-red-500" : ""}`}>{formatDate(deadline)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Posted</span>
                  <span className="font-medium">{formatDate(ref.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Posted by */}
            <div className="pt-3 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Referrer</p>
              <UserCard user={ref.user} size="md" />
            </div>

            {/* CTA */}
            <div className="pt-3 border-t border-border">
              {isOwner ? (
                <>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <Button variant="outline" size="sm" className="text-xs h-8">Edit</Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50">
                      {isClosed ? "Reopen" : "Close"}
                    </Button>
                  </div>
                  <ReferralApplicationsPanel referralId={ref.id} initialCount={ref._count.applications} />
                </>
              ) : isClosed ? (
                <div className="text-center py-3 text-sm text-muted-foreground bg-muted/50 rounded-xl">
                  This referral is no longer accepting applications.
                </div>
              ) : (
                <ReferralApplyPanel
                  referralId={ref.id}
                  myApplication={myApplication as any}
                  referrerName={ref.user.name ?? "Referrer"}
                  referralTitle={ref.title}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
