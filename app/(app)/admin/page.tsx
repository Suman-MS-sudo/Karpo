import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Users, Building2, Tag, Shield, ShieldCheck, Zap,
  DollarSign, TrendingUp, Clock, AlertTriangle, CheckCircle,
  MessageSquare, Star,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatRelativeTime } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const session = await auth()
  if (!session) redirect("/auth/signin?callbackUrl=/admin")
  if (session.user?.role !== "ADMIN") redirect("/dashboard")

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

  const [
    totalUsers, verifiedUsers, premiumUsers, newUsersThisMonth,
    pendingCompanies, approvedCompanies,
    activeListings, activeRentals, activeReferrals, activeRoutes,
    activeEvents, activeCourses, activeSkills,
    pendingConcierge, totalConcierge,
    totalRevenue, revenueThisMonth,
    flaggedListings,
    recentUsers, pendingRequests, recentConcierge,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.membership.count({ where: { plan: "PREMIUM" } }),
    prisma.user.count({ where: { createdAt: { gte: monthStart } } }),
    prisma.companyRequest.count({ where: { status: "PENDING" } }),
    prisma.company.count({ where: { isApproved: true } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.rentalPost.count({ where: { status: "ACTIVE" } }),
    prisma.jobReferral.count({ where: { status: "OPEN" } }),
    prisma.carpoolRoute.count({ where: { isActive: true } }),
    prisma.event.count({ where: { isActive: true, date: { gte: now } } }),
    prisma.course.count({ where: { isActive: true } }),
    prisma.skillListing.count({ where: { status: "ACTIVE" } }),
    prisma.conciergeLead.count({ where: { status: { notIn: ["COMPLETED", "CANCELLED"] } } }),
    prisma.conciergeLead.count(),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: "COMPLETED", createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.listingReport.count({ where: { status: "PENDING" } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" }, take: 8,
      include: { company: { select: { name: true } }, membership: { select: { plan: true } } },
    }),
    prisma.companyRequest.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.conciergeLead.findMany({
      where: { status: { notIn: ["COMPLETED", "CANCELLED"] } },
      orderBy: { createdAt: "desc" }, take: 5,
      include: { user: { select: { name: true, email: true } } },
    }),
  ])

  const totalRevenueAmt = (totalRevenue._sum.amount ?? 0) / 100
  const monthRevenueAmt = (revenueThisMonth._sum.amount ?? 0) / 100

  const statCards = [
    { label: "Total Users",     value: totalUsers,        sub: `+${newUsersThisMonth} this month`, icon: Users,       color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-950/30" },
    { label: "Verified",        value: verifiedUsers,     sub: `${Math.round(verifiedUsers/totalUsers*100)}% of users`, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    { label: "Premium Members", value: premiumUsers,      sub: `${Math.round(premiumUsers/totalUsers*100)}% of users`, icon: Zap,         color: "text-amber-600",  bg: "bg-amber-50 dark:bg-amber-950/30" },
    { label: "Companies",       value: approvedCompanies, sub: `${pendingCompanies} pending`,       icon: Building2,   color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { label: "Revenue (₹)",     value: `₹${totalRevenueAmt.toLocaleString("en-IN")}`, sub: `₹${monthRevenueAmt.toLocaleString("en-IN")} this month`, icon: DollarSign, color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
    { label: "Flagged Content", value: flaggedListings,   sub: "pending review",                    icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
  ]

  const serviceStats = [
    { label: "Marketplace",  value: activeListings,   href: "/marketplace"  },
    { label: "Rentals",      value: activeRentals,    href: "/rentals"      },
    { label: "Referrals",    value: activeReferrals,  href: "/referrals"    },
    { label: "Carpool",      value: activeRoutes,     href: "/carpool"      },
    { label: "Events",       value: activeEvents,     href: "/events"       },
    { label: "Courses",      value: activeCourses,    href: "/learning"     },
    { label: "Skills",       value: activeSkills,     href: "/skills"       },
    { label: "Concierge",    value: pendingConcierge, href: "/admin/concierge" },
  ]

  const STATUS_COLOR: Record<string, string> = {
    PENDING:     "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    IN_REVIEW:   "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    IN_PROGRESS: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
    COMPLETED:   "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    CANCELLED:   "bg-muted text-muted-foreground",
  }

  return (
    <div className="p-6 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform overview and pending actions</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${bg}`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xl font-bold leading-none">{value}</p>
            <div>
              <p className="text-xs font-medium text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Service activity */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" /> Active Content by Service
        </h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {serviceStats.map(({ label, value, href }) => (
            <Link key={label} href={href}
              className="text-center p-3 rounded-xl border border-border hover:bg-muted transition-colors">
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pending company approvals */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Pending Companies
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant={pendingCompanies > 0 ? "warning" : "secondary"}>{pendingCompanies}</Badge>
              <Link href="/admin/companies" className="text-xs text-primary-600 hover:underline">All</Link>
            </div>
          </div>
          {pendingRequests.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <CheckCircle className="h-4 w-4 text-green-500" /> All clear
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="p-3 bg-muted/40 rounded-xl space-y-2">
                  <div>
                    <p className="font-medium text-sm">{req.name}</p>
                    <p className="text-xs text-muted-foreground">@{req.domain} · {req.city ?? "Unknown city"}</p>
                    <p className="text-xs text-muted-foreground">by {req.requestedBy} · {formatRelativeTime(req.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <form action={`/api/admin/companies/${req.id}/approve`} method="POST" className="flex-1">
                      <Button size="sm" type="submit" className="w-full text-xs h-7">Approve</Button>
                    </form>
                    <form action={`/api/admin/companies/${req.id}/reject`} method="POST" className="flex-1">
                      <Button size="sm" variant="outline" type="submit" className="w-full text-xs h-7">Reject</Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending concierge leads */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" /> Concierge Queue
            </h2>
            <div className="flex items-center gap-2">
              <Badge variant={pendingConcierge > 0 ? "warning" : "secondary"}>{pendingConcierge}</Badge>
              <Link href="/admin/concierge" className="text-xs text-primary-600 hover:underline">All</Link>
            </div>
          </div>
          {recentConcierge.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <CheckCircle className="h-4 w-4 text-green-500" /> Queue empty
            </div>
          ) : (
            <div className="space-y-2">
              {recentConcierge.map((lead) => (
                <div key={lead.id} className="flex items-start justify-between gap-2 p-2.5 bg-muted/40 rounded-xl">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{lead.user.name ?? lead.user.email}</p>
                    <p className="text-xs text-muted-foreground">{lead.serviceType} · {formatRelativeTime(lead.createdAt)}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[lead.status] ?? ""}`}>
                    {lead.status}
                  </span>
                </div>
              ))}
              <Link href="/admin/concierge">
                <Button variant="outline" size="sm" className="w-full text-xs mt-1">Manage all →</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Recent users */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" /> Recent Signups
            </h2>
            <Link href="/admin/users" className="text-xs text-primary-600 hover:underline">All users</Link>
          </div>
          <div className="space-y-2">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors">
                <div className="h-7 w-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300 shrink-0">
                  {user.name?.[0]?.toUpperCase() ?? "?"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{user.name ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.company?.name ?? "No company"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {user.isVerified
                    ? <span className="text-[10px] text-green-600 font-medium">Verified</span>
                    : <span className="text-[10px] text-amber-600 font-medium">Pending</span>}
                  {user.membership?.plan === "PREMIUM" && (
                    <span className="text-[10px] text-amber-500 font-medium">Premium</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick action links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/admin/users",     label: "Manage Users",    icon: Users,       desc: "Verify, promote, search" },
          { href: "/admin/companies", label: "Companies",       icon: Building2,   desc: "Approve & manage" },
          { href: "/admin/deals",     label: "Manage Deals",    icon: Tag,         desc: "Create, edit, activate" },
          { href: "/admin/concierge", label: "Concierge Leads", icon: Shield,      desc: "Assign & update status" },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href}>
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-sm hover:border-foreground/20 transition-all">
              <Icon className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
