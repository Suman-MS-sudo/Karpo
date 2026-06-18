"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CITIES, LISTING_CATEGORIES, LISTING_CONDITIONS } from "@/config/services"

export default function EditListingPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()

  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [images, setImages]       = useState<string[]>([])
  const [form, setForm] = useState({
    title: "", description: "", price: "",
    category: "", condition: "USED", city: "", area: "", isNegotiable: true,
    purchaseYear: "",
  })

  // Load existing listing
  useEffect(() => {
    setLoading(true)
    fetch(`/api/listings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({
          title:        data.title        ?? "",
          description:  data.description  ?? "",
          price:        String(data.price ?? ""),
          category:     data.category     ?? "",
          condition:    data.condition    ?? "USED",
          city:         data.city         ?? "",
          area:         data.area         ?? "",
          isNegotiable: data.isNegotiable  ?? true,
          purchaseYear: data.purchaseYear ? String(data.purchaseYear) : "",
        })
        setImages(Array.isArray(data.images) ? data.images : [])
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (images.length + files.length > 10) { alert("Maximum 10 images allowed"); return }
    setUploading(true)
    try {
      for (const file of files) {
        const fd = new FormData()
        fd.append("file", file)
        const res  = await fetch("/api/upload", { method: "POST", body: fd })
        const data = await res.json()
        if (data.url) setImages((prev) => [...prev, data.url])
      }
    } finally { setUploading(false) }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category) { alert("Please select a category"); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price:        parseInt(form.price),
          purchaseYear: form.purchaseYear ? parseInt(form.purchaseYear) : null,
          images,
        }),
      })
      if (res.ok) router.push(`/marketplace/${id}`)
      else {
        const data = await res.json()
        alert(data.error ?? "Failed to save")
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!confirm("Permanently delete this listing? This cannot be undone.")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
      if (res.ok) router.push("/marketplace")
      else alert("Failed to delete listing")
    } finally { setDeleting(false) }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/marketplace/${id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to listing
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Listing</h1>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleDelete}
          disabled={deleting}
          className="gap-1.5"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          Delete
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input
            required
            placeholder="e.g. iPhone 15 Pro Max 256GB"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">{form.title.length}/100</p>
        </div>

        {/* Category + Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select required value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {LISTING_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Condition *</Label>
            <Select required value={form.condition} onValueChange={(v) => setForm((f) => ({ ...f, condition: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LISTING_CONDITIONS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
                <SelectItem value="USED">Used (general)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price + City */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Asking Price (₹) *</Label>
            <Input
              required type="number" min="1" max="10000000"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>City *</Label>
            <Select required value={form.city} onValueChange={(v) => setForm((f) => ({ ...f, city: v }))}>
              <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Area / Locality */}
        <div className="space-y-1.5">
          <Label>Area / Locality</Label>
          <Input
            placeholder="e.g. Banjara Hills, HSR Layout, Koramangala…"
            value={form.area}
            onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">Neighbourhood or landmark — helps buyers find you</p>
        </div>

        {/* Purchase Year */}
        <div className="space-y-1.5">
          <Label>Purchase Year</Label>
          <Select value={form.purchaseYear} onValueChange={(v) => setForm((f) => ({ ...f, purchaseYear: v }))}>
            <SelectTrigger><SelectValue placeholder="Select year" /></SelectTrigger>
            <SelectContent className="max-h-56">
              {Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Negotiable */}
        <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
          <button
            type="button"
            role="switch"
            aria-checked={form.isNegotiable}
            onClick={() => setForm((f) => ({ ...f, isNegotiable: !f.isNegotiable }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              form.isNegotiable ? "bg-success" : "bg-muted-foreground/30"
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              form.isNegotiable ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
          <div>
            <p className="font-medium text-sm">Price is negotiable</p>
            <p className="text-xs text-muted-foreground">Buyers will see &quot;Negotiable&quot; on your listing</p>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label>Description *</Label>
          <Textarea
            required rows={5}
            placeholder="Describe the item…"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">{form.description.length}/2000</p>
        </div>

        {/* Images */}
        <div className="space-y-2">
          <Label>Photos <span className="text-muted-foreground font-normal">(max 10)</span></Label>
          <div className="grid grid-cols-5 gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded-full">Cover</span>
                )}
              </div>
            ))}
            {images.length < 10 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors gap-1">
                {uploading
                  ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  : <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Add</span></>
                }
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="sr-only" disabled={uploading} />
              </label>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" className="flex-1" size="lg" disabled={saving || uploading}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" size="lg" asChild>
            <Link href={`/marketplace/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
