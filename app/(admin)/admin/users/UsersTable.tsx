"use client"

import { useEffect, useRef, useState } from "react"
import { Settings2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatDateTime } from "@/lib/utils"
import { UserActions } from "./UserActions"

export interface UserRow {
  id: string
  name: string | null
  email: string | null
  avatarUrl: string | null
  image: string | null
  company: { name: string; domain: string } | null
  userCode: string | null
  batchCode: string | null
  referralCode: string | null
  isVerified: boolean
  role: string
  isDisabled: boolean
  department: string | null
  jobTitle: string | null
  city: string | null
  phone: string | null
  createdAt: Date
  lastLoginAt: Date | null
  membership: { plan: string } | null
  _count: { listings: number; jobReferrals: number }
}

// Columns a viewer can hide. "User" and "Actions" are pinned — always shown,
// so they're not part of this list.
const TOGGLABLE_COLUMNS = [
  { id: "company",      label: "Company" },
  { id: "userCode",     label: "User Code" },
  { id: "referralCode", label: "Referral Code" },
  { id: "status",       label: "Status" },
  { id: "joined",       label: "Joined" },
  { id: "lastLogin",    label: "Last logged in" },
  { id: "activity",     label: "Activity" },
] as const

type ColumnId = (typeof TOGGLABLE_COLUMNS)[number]["id"]

const STORAGE_KEY = "korpo-admin-users-columns-v1"

function loadHiddenColumns(): Set<ColumnId> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

export function UsersTable({ users, currentAdminId }: { users: UserRow[]; currentAdminId: string }) {
  const [hidden, setHidden] = useState<Set<ColumnId>>(new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const topScrollRef   = useRef<HTMLDivElement>(null)
  const tableScrollRef = useRef<HTMLDivElement>(null)
  const [scrollWidth, setScrollWidth] = useState(0)

  // Mirror a slim scrollbar above the table — dragging either one keeps the
  // other in sync, since the real table is often taller than the viewport
  // and its bottom scrollbar can be scrolled out of view.
  useEffect(() => {
    const el = tableScrollRef.current
    if (!el) return
    const update = () => setScrollWidth(el.scrollWidth)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [hidden])

  function syncFromTop() {
    if (topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft
    }
  }
  function syncFromTable() {
    if (topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft
    }
  }

  // Read the saved column preference after mount only — reading localStorage
  // during the initial render would mismatch the server-rendered HTML (which
  // has no access to it) and trigger a hydration error.
  useEffect(() => {
    setHidden(loadHiddenColumns())
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  function toggleColumn(id: ColumnId) {
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      return next
    })
  }

  const show = (id: ColumnId) => !hidden.has(id)

  return (
    <div className="bg-card border border-border rounded-2xl shadow-sm">
      <div className="flex items-center justify-end px-3 py-2 border-b border-border relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Settings2 className="h-3.5 w-3.5" /> Columns
        </button>
        {menuOpen && (
          <div className="absolute right-3 top-11 z-20 w-56 rounded-xl border border-border bg-card shadow-lg p-2">
            <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Show columns</p>
            {TOGGLABLE_COLUMNS.map((col) => (
              <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={show(col.id)}
                  onChange={() => toggleColumn(col.id)}
                  className="h-3.5 w-3.5 rounded border-border accent-primary-600"
                />
                {col.label}
              </label>
            ))}
          </div>
        )}
      </div>

      <div ref={topScrollRef} onScroll={syncFromTop} className="overflow-x-auto overflow-y-hidden">
        <div style={{ width: scrollWidth || "100%", height: 1 }} />
      </div>

      <div ref={tableScrollRef} onScroll={syncFromTable} className="overflow-x-auto">
        <table className="w-full text-sm border-collapse" style={{ minWidth: 1240 }}>
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">User</th>
              {show("company")      && <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Company</th>}
              {show("userCode")     && <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">User Code</th>}
              {show("referralCode") && <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Referral Code</th>}
              {show("status")       && <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Status</th>}
              {show("joined")       && <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Joined</th>}
              {show("lastLogin")    && <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Last logged in</th>}
              {show("activity")     && <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Activity</th>}
              <th className="text-right px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sticky right-0 z-10 bg-muted/40 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.length === 0 ? (
              <tr><td colSpan={TOGGLABLE_COLUMNS.length + 2} className="text-center py-16 text-muted-foreground text-sm">No users found</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors group">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl || user.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl ?? user.image ?? ""}
                        alt=""
                        className="h-9 w-9 rounded-full object-cover shrink-0 ring-1 ring-border"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-xs font-bold text-primary-700 dark:text-primary-300 shrink-0">
                        {(user.name ?? user.email)?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate leading-tight whitespace-nowrap">{user.name ?? user.email?.split("@")[0] ?? "Unnamed user"}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 whitespace-nowrap">{user.email}</p>
                    </div>
                  </div>
                </td>
                {show("company") && (
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-sm">{user.company?.name ?? <span className="text-muted-foreground">—</span>}</p>
                    {user.company?.domain && <p className="text-xs text-muted-foreground mt-0.5">@{user.company.domain}</p>}
                  </td>
                )}
                {show("userCode") && (
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-sm font-mono">{user.userCode ?? <span className="text-muted-foreground">—</span>}</p>
                    {user.batchCode && <p className="text-xs text-muted-foreground mt-0.5">Batch {user.batchCode}</p>}
                  </td>
                )}
                {show("referralCode") && (
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <p className="text-sm font-mono">{user.referralCode ?? <span className="text-muted-foreground">—</span>}</p>
                  </td>
                )}
                {show("status") && (
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex flex-wrap items-center gap-1">
                      {user.isVerified
                        ? <Badge variant="verified" className="text-[10px]">Verified</Badge>
                        : <Badge variant="secondary" className="text-[10px]">Unverified</Badge>}
                      {user.membership?.plan === "PREMIUM" && (
                        <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300">Premium</Badge>
                      )}
                      {user.role === "ADMIN" && (
                        <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300">Admin</Badge>
                      )}
                      {user.role === "GUEST" && (
                        <Badge className="text-[10px] bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/40 dark:text-sky-300">Guest</Badge>
                      )}
                      {user.isDisabled && (
                        <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                      )}
                    </div>
                  </td>
                )}
                {show("joined") && (
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>
                )}
                {show("lastLogin") && (
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : <span className="text-muted-foreground/60">Never</span>}
                  </td>
                )}
                {show("activity") && (
                  <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                    {user._count.listings} listings · {user._count.jobReferrals} referrals
                  </td>
                )}
                <td className="px-5 py-3.5 text-right sticky right-0 z-10 bg-card group-hover:bg-muted/20 border-l border-border transition-colors whitespace-nowrap">
                  <UserActions
                    userId={user.id}
                    name={user.name}
                    email={user.email}
                    department={user.department}
                    jobTitle={user.jobTitle}
                    city={user.city}
                    phone={user.phone}
                    isVerified={user.isVerified}
                    role={user.role}
                    isDisabled={user.isDisabled}
                    currentAdminId={currentAdminId}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
