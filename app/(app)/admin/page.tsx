import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Users, Building2, ToggleLeft, Flag, DollarSign, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export default async function AdminPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/dashboard")

  const [
    totalUsers,
    verifiedUsers,
    pendingCompanies,
    activeListings,
    totalRevenue,
    recentUsers,
    pendingRequests,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isVerified: true } }),
    prisma.companyRequest.count({ where: { status: "PENDING" } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 10, include: { company: true } }),
    prisma.companyRequest.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "desc" }, take: 10 }),
  ])

  const stats = [
    { label: "Total Users", value: totalUsers, icon: Users, color: "text-blue-600" },
    { label: "Verified Users", value: verifiedUsers, icon: ShieldCheck, color: "text-green-600" },
    { label: "Pending Approvals", value: pendingCompanies, icon: Building2, color: "text-orange-500" },
    { label: "Active Listings", value: activeListings, icon: Flag, color: "text-purple-600" },
    { label: "Total Revenue (₹)", value: ((totalRevenue._sum.amount ?? 0) / 100).toLocaleString(), icon: DollarSign, color: "text-teal-600" },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage companies, users, and platform health</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4">
            <Icon className={`h-5 w-5 ${color} mb-2`} />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending company approvals */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Building2 className="h-4 w-4" /> Pending Companies</h2>
            <Badge variant={pendingCompanies > 0 ? "warning" : "secondary"}>{pendingCompanies}</Badge>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending requests</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between gap-3 p-3 bg-surface rounded-xl">
                  <div>
                    <p className="font-medium text-sm">{req.name}</p>
                    <p className="text-xs text-muted-foreground">@{req.domain} · {req.city ?? "Unknown city"}</p>
                    <p className="text-xs text-muted-foreground">Requested by {req.requestedBy} · {formatDate(req.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={`/api/admin/companies/${req.id}/approve`} method="POST">
                      <Button size="sm" type="submit">Approve</Button>
                    </form>
                    <form action={`/api/admin/companies/${req.id}/reject`} method="POST">
                      <Button size="sm" variant="outline" type="submit">Reject</Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent users */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4" /> Recent Users</h2>
          </div>
          <div className="space-y-2">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 p-2.5 hover:bg-surface rounded-xl">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{user.name ?? "—"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email} · {user.company?.name ?? "No company"}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {user.isVerified ? <Badge variant="verified" className="text-xs">Verified</Badge> : <Badge variant="secondary" className="text-xs">Pending</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { href: "/admin/companies", label: "All Companies", icon: Building2 },
          { href: "/admin/users", label: "All Users", icon: Users },
          { href: "/admin/deals", label: "Manage Deals", icon: Flag },
          { href: "/admin/services", label: "Toggle Services", icon: ToggleLeft },
        ].map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}>
            <div className="bg-card border border-border rounded-xl p-4 hover:shadow-sm transition-shadow flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
