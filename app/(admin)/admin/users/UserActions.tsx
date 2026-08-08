"use client"

import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import {
  MoreVertical, ShieldCheck, ShieldOff, Crown, Loader2, Ban, CheckCircle2,
  Pencil, Trash2, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  userId: string
  name: string | null
  email: string | null
  department: string | null
  jobTitle: string | null
  city: string | null
  phone: string | null
  isVerified: boolean
  role: string
  isDisabled: boolean
  currentAdminId: string
}

export function UserActions({
  userId, name, email, department, jobTitle, city, phone,
  isVerified, role, isDisabled, currentAdminId,
}: Props) {
  const router = useRouter()
  const [verified, setVerified] = useState(isVerified)
  const [userRole, setUserRole] = useState(role)
  const [disabled, setDisabled] = useState(isDisabled)
  const [loading, setLoading]   = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })

  const isSelf = userId === currentAdminId

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current?.contains(e.target as Node)) return
      if (btnRef.current?.contains(e.target as Node)) return
      setMenuOpen(false)
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  function openMenu() {
    const rect = btnRef.current?.getBoundingClientRect()
    if (rect) setMenuPos({ top: rect.bottom + 6, left: rect.right - 200 })
    setMenuOpen((o) => !o)
  }

  async function patch(body: object, optimistic?: () => void) {
    const key = JSON.stringify(body)
    setLoading(key)
    optimistic?.()
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? "Action failed")
        setVerified(isVerified)
        setUserRole(role)
        setDisabled(isDisabled)
      } else {
        router.refresh()
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={openMenu}
        className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {menuOpen && createPortal(
        <div
          ref={menuRef}
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
          className="z-[150] w-52 bg-card border border-border rounded-xl shadow-xl py-1.5 overflow-hidden"
        >
          <button
            onClick={() => { setMenuOpen(false); setEditOpen(true) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-muted transition-colors text-left"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit user
          </button>

          <button
            disabled={!!loading}
            onClick={() => { setMenuOpen(false); patch({ isVerified: !verified }, () => setVerified((v) => !v)) }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-muted transition-colors text-left"
          >
            {verified ? <ShieldOff className="h-3.5 w-3.5 text-muted-foreground" /> : <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />}
            {verified ? "Unverify" : "Verify"}
          </button>

          {!isSelf && (
            <button
              disabled={!!loading}
              onClick={() => { setMenuOpen(false); patch({ role: userRole === "ADMIN" ? "USER" : "ADMIN" }, () => setUserRole((r) => r === "ADMIN" ? "USER" : "ADMIN")) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-muted transition-colors text-left"
            >
              <Crown className="h-3.5 w-3.5 text-muted-foreground" /> {userRole === "ADMIN" ? "Demote to user" : "Make admin"}
            </button>
          )}

          {!isSelf && (
            <button
              disabled={!!loading}
              onClick={() => { setMenuOpen(false); patch({ isDisabled: !disabled }, () => setDisabled((d) => !d)) }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-muted transition-colors text-left"
            >
              {disabled ? <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" /> : <Ban className="h-3.5 w-3.5 text-muted-foreground" />}
              {disabled ? "Enable account" : "Disable account"}
            </button>
          )}

          {!isSelf && (
            <>
              <div className="h-px bg-border my-1" />
              <button
                onClick={() => { setMenuOpen(false); setDeleteOpen(true) }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 transition-colors text-left"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete user
              </button>
            </>
          )}

          {loading && (
            <div className="px-3.5 py-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
            </div>
          )}
        </div>,
        document.body
      )}

      {editOpen && (
        <EditUserModal
          userId={userId}
          initial={{ name, email, department, jobTitle, city, phone }}
          onClose={() => setEditOpen(false)}
          onSaved={() => { setEditOpen(false); router.refresh() }}
        />
      )}

      {deleteOpen && (
        <DeleteUserModal
          userId={userId}
          name={name}
          email={email}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => { setDeleteOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}

// ── Edit modal ───────────────────────────────────────────────────────────────

function EditUserModal({
  userId, initial, onClose, onSaved,
}: {
  userId: string
  initial: { name: string | null; email: string | null; department: string | null; jobTitle: string | null; city: string | null; phone: string | null }
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: initial.name ?? "", email: initial.email ?? "", department: initial.department ?? "",
    jobTitle: initial.jobTitle ?? "", city: initial.city ?? "", phone: initial.phone ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")

  async function save() {
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "Failed to save"); return }
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold">Edit user</h2>
          <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="p-5 space-y-3.5">
          {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Full name</label>
            <input className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-600/50" {...field("name")} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email</label>
            <input type="email" className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-600/50" {...field("email")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
              <input className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-600/50" {...field("department")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Job title</label>
              <input className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-600/50" {...field("jobTitle")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">City</label>
              <input className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-600/50" {...field("city")} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
              <input className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-600/50" {...field("phone")} />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save changes"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteUserModal({
  userId, name, email, onClose, onDeleted,
}: {
  userId: string
  name: string | null
  email: string | null
  onClose: () => void
  onDeleted: () => void
}) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function confirmDelete() {
    setDeleting(true)
    setError("")
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "Failed to delete"); return }
      onDeleted()
    } finally {
      setDeleting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-5">
        <div className="h-11 w-11 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mb-4">
          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-sm font-semibold">Delete {name || email || "this user"}?</h2>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
          This permanently removes their account and all associated listings, messages, and
          activity. This can&apos;t be undone.
        </p>
        {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2 mt-3">{error}</p>}
        <div className="flex items-center justify-end gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={confirmDelete}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Delete permanently"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
