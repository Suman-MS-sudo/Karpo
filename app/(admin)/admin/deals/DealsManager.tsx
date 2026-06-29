"use client"
import { useState } from "react"
import Image from "next/image"
import {
  Tag, Plus, Pencil, ToggleLeft, ToggleRight, Trash2, X, Loader2,
  Users, Star, Flame, Clock, Search, SlidersHorizontal, Globe,
  Image as ImageIcon,
} from "lucide-react"
import { Button }   from "@/components/ui/button"
import { Input }    from "@/components/ui/input"
import { Label }    from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge }    from "@/components/ui/badge"
import { cn, formatDate } from "@/lib/utils"
import { DEAL_CATEGORIES } from "@/app/(app)/deals/DealsClient"

interface AdminDeal {
  id: string; title: string; description: string; discount: number
  code: string | null; validFrom: Date | string | null; validUntil: Date | string
  category: string; merchantName: string; merchantUrl: string | null
  companyLogo: string | null; terms: string | null; usageLimit: number | null
  usedCount: number; isActive: boolean; featured: boolean; trending: boolean
  badge: string | null; source: string
  _count: { redemptions: number }
}

const CATEGORIES = DEAL_CATEGORIES.filter((c) => c.value !== "")

const BADGE_OPTIONS = [
  { value: "",             label: "None"          },
  { value: "NEW",          label: "🆕 New"         },
  { value: "TRENDING",     label: "🔥 Trending"    },
  { value: "LIMITED_TIME", label: "⏰ Limited Time" },
  { value: "EXCLUSIVE",    label: "⭐ Exclusive"   },
]

const SOURCE_OPTIONS = [
  { value: "MANUAL",  label: "Manual entry"   },
  { value: "API",     label: "API / Partner"  },
  { value: "SCRAPED", label: "Scraped"        },
  { value: "IMPORT",  label: "Bulk import"    },
]

const EMPTY = {
  title: "", description: "", discount: "", code: "", validFrom: "",
  validUntil: "", category: "OTHER", merchantName: "", merchantUrl: "",
  companyLogo: "", terms: "", usageLimit: "", redemptionSteps: "",
  featured: false, trending: false, badge: "", source: "MANUAL",
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" onClick={() => onChange(!value)}
      className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all select-none",
        value ? "bg-primary-50 dark:bg-primary-950/30 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300"
              : "border-border text-muted-foreground hover:border-foreground/30")}>
      {value ? <ToggleRight className="h-4 w-4 text-primary-600" /> : <ToggleLeft className="h-4 w-4" />}
      {label}
    </button>
  )
}

export function DealsManager({ deals: initial }: { deals: AdminDeal[] }) {
  const [deals, setDeals]       = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState<AdminDeal | null>(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [catFilter, setCatFilter]       = useState("")
  const [searchQ, setSearchQ]           = useState("")

  function field<K extends keyof typeof EMPTY>(k: K, v: typeof EMPTY[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function openCreate() {
    setEditing(null); setForm(EMPTY); setShowForm(true); setError("")
  }
  function openEdit(d: AdminDeal) {
    setEditing(d)
    setForm({
      title: d.title, description: d.description,
      discount: String(d.discount), code: d.code ?? "",
      validFrom:  d.validFrom  ? new Date(d.validFrom).toISOString().split("T")[0]  : "",
      validUntil: new Date(d.validUntil).toISOString().split("T")[0],
      category: d.category, merchantName: d.merchantName,
      merchantUrl: d.merchantUrl ?? "", companyLogo: d.companyLogo ?? "",
      terms: d.terms ?? "", usageLimit: d.usageLimit != null ? String(d.usageLimit) : "",
      redemptionSteps: "",
      featured: d.featured, trending: d.trending,
      badge: d.badge ?? "", source: d.source ?? "MANUAL",
    })
    setShowForm(true); setError("")
  }

  async function save() {
    if (!form.title || !form.description || !form.discount || !form.validUntil || !form.merchantName) {
      setError("Title, description, discount, merchant name and valid until are required.")
      return
    }
    setSaving(true); setError("")
    try {
      const payload = {
        title:        form.title,
        description:  form.description,
        discount:     parseInt(form.discount),
        code:         form.code         || null,
        validFrom:    form.validFrom    ? new Date(form.validFrom).toISOString()    : null,
        validUntil:   new Date(form.validUntil).toISOString(),
        category:     form.category,
        merchantName: form.merchantName,
        merchantUrl:  form.merchantUrl  || null,
        companyLogo:  form.companyLogo  || null,
        terms:        form.terms        || null,
        usageLimit:   form.usageLimit   ? parseInt(form.usageLimit) : null,
        redemptionSteps: form.redemptionSteps || null,
        featured:     form.featured,
        trending:     form.trending,
        badge:        form.badge        || null,
        source:       form.source,
      }
      if (editing) {
        const res  = await fetch(`/api/admin/deals/${editing.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Failed"); return }
        setDeals((ds) => ds.map((x) => x.id === editing.id ? { ...x, ...data } : x))
      } else {
        const res  = await fetch("/api/admin/deals", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error ?? "Failed"); return }
        setDeals((ds) => [{ ...data, _count: { redemptions: 0 } }, ...ds])
      }
      setShowForm(false)
    } finally { setSaving(false) }
  }

  async function toggleActive(d: AdminDeal) {
    const res = await fetch(`/api/admin/deals/${d.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !d.isActive }),
    })
    if (res.ok) setDeals((ds) => ds.map((x) => x.id === d.id ? { ...x, isActive: !d.isActive } : x))
  }

  async function toggleFeatured(d: AdminDeal) {
    const res = await fetch(`/api/admin/deals/${d.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !d.featured }),
    })
    if (res.ok) setDeals((ds) => ds.map((x) => x.id === d.id ? { ...x, featured: !d.featured } : x))
  }

  async function toggleTrending(d: AdminDeal) {
    const res = await fetch(`/api/admin/deals/${d.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trending: !d.trending }),
    })
    if (res.ok) setDeals((ds) => ds.map((x) => x.id === d.id ? { ...x, trending: !d.trending } : x))
  }

  async function deleteDeal(id: string) {
    if (!confirm("Delete this deal permanently?")) return
    const res = await fetch(`/api/admin/deals/${id}`, { method: "DELETE" })
    if (res.ok) setDeals((ds) => ds.filter((x) => x.id !== id))
  }

  const visible = deals.filter((d) => {
    if (statusFilter === "active"   && !d.isActive)  return false
    if (statusFilter === "inactive" &&  d.isActive)  return false
    if (catFilter && d.category !== catFilter)        return false
    if (searchQ) {
      const q = searchQ.toLowerCase()
      if (!d.title.toLowerCase().includes(q) && !d.merchantName.toLowerCase().includes(q)) return false
    }
    return true
  })

  const activeCnt   = deals.filter((d) => d.isActive).length
  const featuredCnt = deals.filter((d) => d.featured).length
  const trendingCnt = deals.filter((d) => d.trending).length

  return (
    <div className="p-6 space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Tag className="h-5 w-5" />Deals</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{deals.length} total · {activeCnt} active</span>
            <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-500" />{featuredCnt} featured</span>
            <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-orange-500" />{trendingCnt} trending</span>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-1.5"><Plus className="h-4 w-4" />New Deal</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-44">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search deals…" className="pl-8 h-8 text-xs" />
        </div>
        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="" className="text-xs">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value} className="text-xs">{c.emoji} {c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          {(["all","active","inactive"] as const).map((f) => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={cn("px-3 h-8 rounded-lg text-xs font-medium border transition-colors capitalize",
                statusFilter === f ? "bg-foreground text-background border-foreground"
                                   : "border-border text-muted-foreground hover:border-foreground/30")}>
              {f}
            </button>
          ))}
        </div>
        {(searchQ || catFilter) && (
          <button onClick={() => { setSearchQ(""); setCatFilter("") }}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            <X className="h-3 w-3" />Clear
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{visible.length} shown</span>
      </div>

      {/* Deals list */}
      <div className="space-y-2.5">
        {visible.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <Tag className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No deals match your filters.</p>
          </div>
        )}
        {visible.map((deal) => (
          <div key={deal.id}
            className={cn("bg-card border rounded-xl p-4 flex items-start gap-4 transition-opacity",
              deal.isActive ? "border-border" : "border-border opacity-55")}>

            {/* Logo */}
            <div className="h-11 w-11 rounded-xl bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
              {deal.companyLogo ? (
                <Image src={deal.companyLogo} alt={deal.merchantName} width={36} height={36} className="object-contain p-0.5" />
              ) : (
                <Tag className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                <span className="text-sm font-semibold">{deal.title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 font-bold">
                  {deal.discount}% OFF
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {CATEGORIES.find((c) => c.value === deal.category)?.emoji} {deal.category}
                </span>
                {deal.featured && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Star className="h-2.5 w-2.5" />Featured
                  </span>
                )}
                {deal.trending && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold flex items-center gap-1">
                    <Flame className="h-2.5 w-2.5" />Trending
                  </span>
                )}
                {deal.badge && (
                  <Badge variant="outline" className="text-[10px] h-auto py-0 px-1.5">{deal.badge}</Badge>
                )}
                {!deal.isActive && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">INACTIVE</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {deal.merchantName}
                {deal.code && <span className="font-mono ml-1.5 text-foreground">· {deal.code}</span>}
                {deal.source !== "MANUAL" && <span className="ml-1.5 opacity-60">· {deal.source}</span>}
              </p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />Expires {formatDate(new Date(deal.validUntil))}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />{deal._count.redemptions} redeemed
                  {deal.usageLimit != null && ` / ${deal.usageLimit}`}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => toggleFeatured(deal)} title={deal.featured ? "Remove featured" : "Mark featured"}
                className={cn("p-1.5 rounded-lg border transition-colors",
                  deal.featured ? "border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-600"
                                : "border-border text-muted-foreground hover:bg-muted")}>
                <Star className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => toggleTrending(deal)} title={deal.trending ? "Remove trending" : "Mark trending"}
                className={cn("p-1.5 rounded-lg border transition-colors",
                  deal.trending ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-600"
                                : "border-border text-muted-foreground hover:bg-muted")}>
                <Flame className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => openEdit(deal)} title="Edit"
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => toggleActive(deal)} title={deal.isActive ? "Deactivate" : "Activate"}
                className="p-1.5 rounded-lg border border-border hover:bg-muted transition-colors">
                {deal.isActive
                  ? <ToggleRight className="h-3.5 w-3.5 text-green-500" />
                  : <ToggleLeft className="h-3.5 w-3.5 text-muted-foreground" />}
              </button>
              <button onClick={() => deleteDeal(deal.id)} title="Delete"
                className="p-1.5 rounded-lg border border-border hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 transition-colors">
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background z-10">
              <h2 className="font-semibold">{editing ? "Edit Deal" : "New Deal"}</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">

              {/* Basic info */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basic Info</legend>
                <div className="space-y-1.5">
                  <Label>Title *</Label>
                  <Input value={form.title} onChange={(e) => field("title", e.target.value)} placeholder="e.g. 20% off at Zepto" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description *</Label>
                  <Textarea rows={2} value={form.description} onChange={(e) => field("description", e.target.value)} placeholder="What does this deal offer?" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Merchant Name *</Label>
                    <Input value={form.merchantName} onChange={(e) => field("merchantName", e.target.value)} placeholder="Zepto" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Merchant Website</Label>
                    <Input value={form.merchantUrl} onChange={(e) => field("merchantUrl", e.target.value)} placeholder="https://zepto.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5"><ImageIcon className="h-3 w-3" />Company Logo URL</Label>
                  <div className="flex gap-2">
                    <Input value={form.companyLogo} onChange={(e) => field("companyLogo", e.target.value)} placeholder="https://…/logo.png" />
                    {form.companyLogo && (
                      <div className="h-9 w-9 rounded-lg border border-border flex items-center justify-center bg-muted shrink-0 overflow-hidden">
                        <Image src={form.companyLogo} alt="" width={28} height={28} className="object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </fieldset>

              {/* Deal details */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deal Details</legend>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Discount % *</Label>
                    <Input type="number" min="1" max="100" value={form.discount} onChange={(e) => field("discount", e.target.value)} placeholder="20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Promo Code</Label>
                    <Input value={form.code} onChange={(e) => field("code", e.target.value)} placeholder="KORPO20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Usage Limit</Label>
                    <Input type="number" min="1" value={form.usageLimit} onChange={(e) => field("usageLimit", e.target.value)} placeholder="Unlimited" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Valid From</Label>
                    <Input type="date" value={form.validFrom} onChange={(e) => field("validFrom", e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Valid Until *</Label>
                    <Input type="date" value={form.validUntil} onChange={(e) => field("validUntil", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Terms & Conditions</Label>
                  <Textarea rows={2} value={form.terms} onChange={(e) => field("terms", e.target.value)} placeholder="Optional terms…" />
                </div>
              </fieldset>

              {/* Category + metadata */}
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Classification</legend>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => field("category", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value} className="text-xs">{c.emoji} {c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Badge</Label>
                    <Select value={form.badge} onValueChange={(v) => field("badge", v)}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        {BADGE_OPTIONS.map((b) => (
                          <SelectItem key={b.value} value={b.value} className="text-xs">{b.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Source</Label>
                    <Select value={form.source} onValueChange={(v) => field("source", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SOURCE_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Featured / Trending toggles */}
                <div className="flex gap-3 flex-wrap pt-1">
                  <Toggle value={form.featured} onChange={(v) => field("featured", v)}
                    label="⭐ Featured — show in Featured carousel" />
                  <Toggle value={form.trending} onChange={(v) => field("trending", v)}
                    label="🔥 Trending — show in Trending section" />
                </div>
              </fieldset>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-3 py-2">{error}</p>
              )}

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
