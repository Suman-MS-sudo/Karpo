import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UsersTable } from "./UsersTable"
import { Users, Search } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminPageHeader"

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
  if (filter === "disabled")   where.isDisabled = true

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
    { value: "disabled",   label: "Disabled" },
  ]

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <AdminPageHeader icon={Users} title="Users" subtitle={`${total.toLocaleString()} users`} gradient="from-blue-500 to-indigo-600" />

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
      <UsersTable users={users} currentAdminId={session?.user?.id ?? ""} />

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
