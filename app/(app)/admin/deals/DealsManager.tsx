"use client"
import { useState } from "react"
import { Tag, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, X, Loader2, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatDate } from "@/lib/utils"

interface Deal {
  id: string; title: string; description: string; discount: number; code: string | null
  validUntil: Date | string; category: string; merchantName: string; merchantUrl: string | null
  terms: string | null; usageLimit: number | null; usedCount: number; isActive: boolean
  _count: { redemptions: number }
}

const CATEGORIES = ["FOOD","FASHION","ELECTRONICS","TRAVEL","HEALTH","ENTERTAINMENT","OTHER"]

const EMPTY = {
  title: "", description: "", discount: "", code: "", validUntil: "",
  category: "OTHER", merchantName: "", merchantUrl: "", terms: "",
  usageLimit: "", redemptionSteps: "",
}

export function DealsManager({ deals: initial }: { deals: Deal[] }) {
  const [deals, setDeals]         = useState(initial)
  const [showForm, setShowForm]   = useState(false)
  const [editing, setEditing]     = useState<Deal | null>(null)
  const [form, setForm]           = useState(EMPTY)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState("")
  const [filter, setFilter]       = useState<"all" | "active" | "inactive">("all")

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true); setError("") }
  function openEdit(deal: Deal) {
    setEditing(deal)
    setForm({
      title: deal.title, description: deal.description,
      discount: String(deal.discount), code: deal.code ?? "",
      validUntil: new Date(deal.validUntil).toISOString().split("T")[0],
      category: deal.category, merchantName: deal.merchantName,
      merchantUrl: deal.merchantUrl ?? "", terms: deal.terms ?? "",
      usageLimit: deal.usageLimit != null ? String(deal.usageLimit) : "",
      redemptionSteps: "",
    })
    setShowForm(true)
    setError("")
  }

  async function save() {
    if (!form.title || !form.description || !form.discount || !form.validUntil || !form.merchantName) {
      setError("Title, description, discount, merchant name and valid until are required."); return
    }
    setSaving(true); setError("")
    try {
      const payload = {
        title: form.title, description: form.description,
        discount: parseInt(form.discount), code: form.code || undefined,
        validUntil: new Date(form.validUntil).toISOString(),
        category: form.category, merchantName: form.merchantName,
        merchantUrl: form.merchantUrl || undefined, terms: form.terms || undefined,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : undefined,
        redemptionSteps: form.redemptionSteps || undefined,
      }
      if (editing) {
        const res = await fetch(`/api/admin/deals/${editing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Failed"); return }
        setDeals((d) => d.map((x) => x.id === editing.id ? { ...x, ...data } : x))
      } else {
        const res = await fetch("/api/admin/deals", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Failed"); return }
        setDeals((d) => [{ ...data, _count: { redemptions: 0 } }, ...d])
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function toggleActive(deal: Deal) {
    const res = await fetch(`/api/admin/deals/${deal.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !deal.isActive }),
    })
    if (res.ok) setDeals((d) => d.map((x) => x.id === deal.id ? { ...x, isActive: !deal.isActive } : x))
  }

  async function deleteDeal(id: string) {
    if (!confirm("Delete this deal? This cannot be undone.")) return
    const res = await fetch(`/api/admin/deals/${id}`, { method: "DELETE" })
    if (res.ok) setDeals((d) => d.filter((x) => x.id !== id))
  }

  const visible = deals.filter((d) =>
    filter === "active" ? d.isActive : filter === "inactive" ? !d.isActive : true
  )

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Tag className="h-5 w-5" /> Deals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{deals.length} total · {deals.filter((d) => d.isActive).length} active</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" />New Deal</Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["all","active","inactive"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${
              filter === f ? "bg-primary-600 text-white border-primary-600" : "border-border text-muted-foreground hover:border-foreground/30"
            }`}>{f}</button>
        ))}
      </div>

      {/* Deals list */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No deals yet. Create one above.</p>
          </div>
        )}
        {visible.map((deal) => (
          <div key={deal.id}
            className={`bg-card border rounded-xl p-4 flex items-start justify-between gap-4 ${deal.isActive ? "border-border" : "border-border opacity-60"}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold">{deal.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-bold">
                  {deal.discount}% OFF
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{deal.category}</span>
                {!deal.isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">INACTIVE</span>}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">{deal.merchantName} {deal.code && `· Code: ${deal.code}`}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span>Expires {formatDate(new Date(deal.validUntil))}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{deal._count.redemptions} redeemed{deal.usageLimit ? ` / ${deal.usageLimit}` : ""}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => openEdit(deal)}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => toggleActive(deal)}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                {deal.isActive
                  ? <ToggleRight className="h-3.5 w-3.5 text-green-500" />
                  : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <button onClick={() => deleteDeal(deal.id)}
                className="p-1.5 rounded-lg border border-border hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 transition-colors">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background">
              <h2 className="font-semibold">{editing ? "Edit Deal" : "New Deal"}</h2>
              <button onClick={() => setShowForm(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. 20% off at Zepto" />
                </div>
                <div className="space-y-1.5">
                  <Label>Merchant Name *</Label>
                  <Input value={form.merchantName} onChange={(e) => setForm((f) => ({ ...f, merchantName: e.target.value }))} placeholder="Zepto" />
                </div>
                <div className="space-y-1.5">
                  <Label>Merchant URL</Label>
                  <Input value={form.merchantUrl} onChange={(e) => setForm((f) => ({ ...f, merchantUrl: e.target.value }))} placeholder="https://zepto.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Discount % *</Label>
                  <Input type="number" min="1" max="100" value={form.discount} onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))} placeholder="20" />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Promo Code</Label>
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="KORPO20 (optional)" />
                </div>
                <div className="space-y-1.5">
                  <Label>Valid Until *</Label>
                  <Input type="date" value={form.validUntil} onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Usage Limit</Label>
                  <Input type="number" min="1" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} placeholder="Unlimited" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Description *</Label>
                  <Textarea rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What does this deal offer?" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Terms & Conditions</Label>
                  <Textarea rows={2} value={form.terms} onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))} placeholder="Optional terms…" />
                </div>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button className="flex-1" disabled={saving} onClick={save}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : editing ? "Save Changes" : "Create Deal"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
