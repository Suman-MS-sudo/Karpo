import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UserActions } from "./UserActions"
import { formatDate } from "@/lib/utils"
import { Users, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: { q?: string; filter?: string; page?: string }
}

export default async function AdminUsersPage({ searchParams }: Props) {
  const session = await auth()

  const q       = searchParams.q?.trim() ?? ""
  const filter  = searchParams.filter ?? "all"
  const page    = Math.max(1, parseInt(searchParams.page ?? "1"))
  const PAGE    = 20

  const where: Record<string, unknown> = {}
  if (q) where.OR = [
    { name:  { contains: q } },
    { email: { contains: q } },
  ]
  if (filter === "unverified") where.isVerified = false
  if (filter === "verified")   where.isVerified = true
  if (filter === "premium")    where.membership = { plan: "PREMIUM" }
  if (filter === "admin")      where.role = "ADMIN"

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: {
        company:    { select: { name: true, domain: true } },
        membership: { select: { plan: true } },
        _count:     { select: { listings: true, jobReferrals: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  const totalPages = Math.ceil(total / PAGE)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams()
    const merged = { q, filter, page: String(page), ...overrides }
    for (const [k, v] of Object.entries(merged)) if (v && v !== "1") p.set(k, v)
    const s = p.toString()
    return `/admin/users${s ? `?${s}` : ""}`
  }

  const FILTERS = [
    { value: "all",        label: "All" },
    { value: "unverified", label: "Unverified" },
    { value: "verified",   label: "Verified" },
    { value: "premium",    label: "Premium" },
    { value: "admin",      label: "Admin" },
  ]

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5" /> Users</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{total.toLocaleString()} users</p>
        </div>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
        </form>
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <a key={f.value} href={buildUrl({ filter: f.value, page: undefined })}>
              <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer transition-all ${
                filter === f.value
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-border text-muted-foreground hover:border-foreground/30"
              }`}>{f.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden md:table-cell">Company</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground hidden lg:table-cell">Posts</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No users found</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300 shrink-0">
                        {user.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{user.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-sm truncate">{user.company?.name ?? <span className="text-muted-foreground">—</span>}</p>
                    {user.company?.domain && <p className="text-xs text-muted-foreground">@{user.company.domain}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {user.isVerified
                        ? <Badge variant="verified" className="text-[10px] w-fit">Verified</Badge>
                        : <Badge variant="secondary" className="text-[10px] w-fit">Unverified</Badge>}
                      {user.membership?.plan === "PREMIUM" && (
                        <Badge className="text-[10px] w-fit bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300">Premium</Badge>
                      )}
                      {user.role === "ADMIN" && (
                        <Badge className="text-[10px] w-fit bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300">Admin</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                    {user._count.listings} listings · {user._count.jobReferrals} referrals
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserActions
                      userId={user.id}
                      isVerified={user.isVerified}
                      role={user.role}
                      currentAdminId={session?.user?.id ?? ""}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <a href={buildUrl({ page: String(page - 1) })}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">← Prev</a>
          )}
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          {page < totalPages && (
            <a href={buildUrl({ page: String(page + 1) })}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors">Next →</a>
          )}
        </div>
      )}
    </div>
  )
}
