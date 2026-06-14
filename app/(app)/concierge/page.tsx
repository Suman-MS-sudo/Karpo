import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Shield, FileText, Scale, Heart, TrendingUp, Clock, ChevronRight, Plus, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatRelativeTime } from "@/lib/utils"
import { FREE_LIMITS } from "@/lib/limits"

const services = [
  { id: "TAX",       title: "Tax Filing",          icon: FileText,   desc: "ITR filing, tax planning, form 16 assistance from verified CAs",         color: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",      iconColor: "text-blue-600 dark:text-blue-400" },
  { id: "LEGAL",     title: "Legal Assistance",    icon: Scale,      desc: "Employment contracts, rental agreements, consumer disputes",               color: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",iconColor: "text-purple-600 dark:text-purple-400" },
  { id: "INSURANCE", title: "Insurance Advisory",  icon: Heart,      desc: "Health, life, and vehicle insurance guidance and claims support",          color: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",   iconColor: "text-green-600 dark:text-green-400" },
  { id: "FINANCIAL", title: "Financial Planning",  icon: TrendingUp, desc: "Investment planning, mutual funds, retirement and goal planning",          color: "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",iconColor: "text-orange-600 dark:text-orange-400" },
]

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING:     { label: "Pending",     color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
  IN_REVIEW:   { label: "In Review",   color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" },
  IN_PROGRESS: { label: "In Progress", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" },
  COMPLETED:   { label: "Completed",   color: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300" },
  CANCELLED:   { label: "Cancelled",   color: "bg-muted text-muted-foreground" },
}

const SERVICE_EMOJI: Record<string, string> = { TAX: "📄", LEGAL: "⚖️", INSURANCE: "🛡️", FINANCIAL: "📈" }
const SERVICE_LABEL: Record<string, string> = { TAX: "Tax Filing", LEGAL: "Legal Assistance", INSURANCE: "Insurance Advisory", FINANCIAL: "Financial Planning" }

export const dynamic = "force-dynamic"

export default async function ConciergePage() {
  const session   = await auth()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  const recentLeads = session?.user?.id
    ? await prisma.conciergeLead.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 3,
      })
    : []

  const activeLeadCount = !isPremium && session?.user?.id
    ? await prisma.conciergeLead.count({
        where: { userId: session.user.id, status: { notIn: ["COMPLETED", "CANCELLED"] } },
      })
    : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-sky-100 dark:bg-sky-900/40 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Concierge Services</h1>
            <p className="text-muted-foreground text-sm">Submit a request → get connected with a vetted expert who assists you personally</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {!isPremium && (
            <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-amber-700 dark:text-amber-300 font-medium">{activeLeadCount}/{FREE_LIMITS.concierge} active requests</span>
              <Link href="/membership" className="flex items-center gap-1 text-amber-600 font-bold hover:underline"><Zap className="h-3 w-3" />Upgrade</Link>
            </div>
          )}
          {recentLeads.length > 0 && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/concierge/my-leads">My Requests</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Purpose banner */}
      <div className="mb-6 bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 flex items-start gap-3">
        <Shield className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-sky-800 dark:text-sky-300">How Concierge is different from Employee Benefits</p>
          <p className="text-sky-700 dark:text-sky-400 mt-0.5">
            Concierge = <strong>submit a request</strong>, and a vetted professional contacts you personally to help (tax filing, legal drafting, insurance claims, financial planning).
            Employee Benefits = <strong>browse ready-made products</strong> (salary loans, group insurance policies, travel packages) and apply directly.
          </p>
        </div>
      </div>

      {/* Recent leads */}
      {recentLeads.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Your Recent Requests</h2>
            <Link href="/concierge/my-leads" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentLeads.map((lead) => {
              const cfg = STATUS_CONFIG[lead.status] ?? STATUS_CONFIG.PENDING
              return (
                <Link key={lead.id} href={`/concierge/${lead.id}`} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-lg">{SERVICE_EMOJI[lead.serviceType] ?? "📋"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{SERVICE_LABEL[lead.serviceType] ?? lead.serviceType}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatRelativeTime(lead.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Service cards */}
      <h2 className="font-semibold mb-4">Submit a New Request</h2>
      <div className="grid sm:grid-cols-2 gap-5">
        {services.map(({ id, title, icon: Icon, desc, color, iconColor }) => (
          <Link key={id} href={`/concierge/new?type=${id}`}>
            <div className={`p-6 rounded-2xl border-2 hover:shadow-md transition-all cursor-pointer ${color}`}>
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm shrink-0">
                  <Icon className={`h-6 w-6 ${iconColor}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{desc}</p>
                  <Button size="sm" className="mt-3">
                    <Plus className="h-3.5 w-3.5 mr-1" />Get Started
                  </Button>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* How it works */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold mb-4">How Concierge Works</h2>
        <div className="grid sm:grid-cols-3 gap-5 text-sm">
          {[
            { step: "1", title: "Submit Request", desc: "Describe your need, budget, and urgency. Takes 2 minutes." },
            { step: "2", title: "Get Matched",    desc: "Our team reviews and matches you with a verified professional within 1–2 days." },
            { step: "3", title: "Get Help",       desc: "Work directly with the professional. Track progress in My Requests." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3">
              <div className="h-7 w-7 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{step}</div>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
