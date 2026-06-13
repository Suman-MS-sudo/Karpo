"use client"
import React, { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  ArrowLeft, Upload, X, Loader2, Info, MapPin, Phone, Search, ChevronDown,
  Cpu, Car, Armchair, Tv, BookOpen, Dumbbell, Shirt,
  UtensilsCrossed, Briefcase, Bike, Activity, Palette, Ticket, Package,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CITIES, LISTING_CATEGORIES, LISTING_CONDITIONS } from "@/config/services"
import type { PickedLocation } from "@/components/marketplace/LocationPicker"

const CATEGORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  ELECTRONICS: Cpu, VEHICLE: Car, FURNITURE: Armchair, APPLIANCE: Tv,
  BOOKS: BookOpen, SPORTS: Dumbbell, CLOTHING: Shirt, KITCHEN: UtensilsCrossed,
  OFFICE: Briefcase, BICYCLE: Bike, HEALTH: Activity, HOME_DECOR: Palette,
  TICKETS: Ticket, OTHER: Package,
}

// Leaflet must not render server-side
const LocationPickerMap = dynamic(
  () => import("@/components/marketplace/LocationPicker").then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl bg-muted border border-border flex items-center justify-center" style={{ height: 380 }}>
        <MapPin className="h-8 w-8 text-muted-foreground" />
      </div>
    ),
  }
)

const MEETING_PREFS = [
  { value: "BOTH",    label: "Pickup or Delivery" },
  { value: "PICKUP",  label: "Buyer picks up only" },
  { value: "DELIVER", label: "Seller can deliver" },
]

const WARRANTY_OPTIONS = [
  "No warranty",
  "Under manufacturer warranty",
  "1 month",
  "3 months",
  "6 months",
  "1 year",
  "2+ years",
]

export default function NewListingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const isPremium = session?.user?.membershipPlan === "PREMIUM"

  const [loading, setLoading]               = useState(false)
  const [uploading, setUploading]           = useState(false)
  const [images, setImages]                 = useState<string[]>([])
  const [location, setLocation]             = useState<PickedLocation | null>(null)
  const [subcategoryOpen, setSubcategoryOpen]   = useState(false)
  const [subcategorySearch, setSubcategorySearch] = useState("")
  const fileInputRef     = useRef<HTMLInputElement>(null)
  const subcategoryRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (subcategoryRef.current && !subcategoryRef.current.contains(e.target as Node)) {
        setSubcategoryOpen(false)
      }
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [])

  const [form, setForm] = useState({
    title:        "",
    description:  "",
    price:        "",
    category:     "",
    subcategory:  "",
    condition:    "USED",
    city:         session?.user?.city ?? "",
    isNegotiable: true,
    brand:        "",
    purchaseYear: "",
    warranty:     "No warranty",
    meetingPref:  "BOTH",
    phone:        "",
  })

  const maxImages = isPremium ? 10 : 5
  const set = (key: string, val: unknown) => setForm((f) => ({ ...f, [key]: val }))

  const selectedCat  = LISTING_CATEGORIES.find(c => c.value === form.category) ?? null
  const filteredSubs = selectedCat
    ? selectedCat.subcategories.filter(s => s.toLowerCase().includes(subcategorySearch.toLowerCase()))
    : []

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (images.length + files.length > maxImages) { alert(`Maximum ${maxImages} images allowed`); return }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.category) { alert("Please select a category"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price:        parseInt(form.price),
          purchaseYear: form.purchaseYear ? parseInt(form.purchaseYear) : null,
          images,
          latitude:  location?.lat ?? null,
          longitude: location?.lng ?? null,
          area:      location?.area ?? null,
        }),
      })
      const data = await res.json()
      if (res.ok) router.push(`/marketplace/${data.id}`)
      else alert(data.error ?? "Failed to create listing")
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/marketplace" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Marketplace
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Post an Item</h1>
        {!isPremium && (
          <Link href="/membership" className="text-xs text-accent-400 hover:underline">
            Free: 5 listings &amp; 5 photos · Upgrade →
          </Link>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Section 1: Item details ─────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Item Details</h2>

          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              required
              placeholder="e.g. iPhone 15 Pro Max 256GB — Space Black"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{form.title.length}/100 — be specific for better search</p>
          </div>

          {/* Category + Condition row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select
                required
                value={form.category}
                onValueChange={(v) => { set("category", v); set("subcategory", "") }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {LISTING_CATEGORIES.map((c) => {
                    const Icon = CATEGORY_ICON_MAP[c.value] ?? Package
                    return (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2.5 py-0.5">
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span>{c.label}</span>
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Condition *</Label>
              <Select required value={form.condition} onValueChange={(v) => set("condition", v)}>
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

          {/* Sub-category searchable combobox — appears once a category is selected */}
          {selectedCat !== null && (
            <div className="space-y-1.5">
              <Label>
                Sub-category{" "}
                <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <div ref={subcategoryRef} className="relative">
                <button
                  type="button"
                  onClick={() => { setSubcategoryOpen(o => !o); setSubcategorySearch("") }}
                  className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 h-10 text-sm hover:bg-muted/40 transition-colors"
                >
                  <span className={form.subcategory ? "text-foreground" : "text-muted-foreground"}>
                    {form.subcategory || "Select sub-category…"}
                  </span>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    {form.subcategory && (
                      <span
                        role="button"
                        onClick={(e) => { e.stopPropagation(); set("subcategory", ""); setSubcategorySearch("") }}
                        className="rounded-full h-5 w-5 flex items-center justify-center hover:bg-muted text-muted-foreground"
                      >
                        <X className="h-3 w-3" />
                      </span>
                    )}
                    <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-150", subcategoryOpen && "rotate-180")} />
                  </div>
                </button>

                {subcategoryOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 border-b border-border">
                      <div className="flex items-center gap-2 bg-muted rounded-lg px-2.5 py-1.5">
                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <input
                          autoFocus
                          type="text"
                          value={subcategorySearch}
                          onChange={(e) => setSubcategorySearch(e.target.value)}
                          placeholder="Search sub-category…"
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {subcategorySearch && (
                          <button type="button" onClick={() => setSubcategorySearch("")} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto py-1">
                      {filteredSubs.length === 0 ? (
                        <p className="text-sm text-muted-foreground px-3 py-4 text-center">
                          No matches for &ldquo;{subcategorySearch}&rdquo;
                        </p>
                      ) : (
                        filteredSubs.map((sub) => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => { set("subcategory", sub); setSubcategoryOpen(false); setSubcategorySearch("") }}
                            className={cn(
                              "w-full text-left text-sm px-3 py-2 transition-colors hover:bg-muted",
                              form.subcategory === sub && "bg-primary/10 text-primary font-medium"
                            )}
                          >
                            {sub}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Brand / Make</Label>
              <Input
                placeholder="e.g. Apple, Samsung"
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Purchase Year</Label>
              <Input
                type="number"
                placeholder={String(new Date().getFullYear())}
                min={1990}
                max={new Date().getFullYear()}
                value={form.purchaseYear}
                onChange={(e) => set("purchaseYear", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Warranty</Label>
              <Select value={form.warranty} onValueChange={(v) => set("warranty", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WARRANTY_OPTIONS.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* ── Section 2: Pricing ──────────────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Pricing</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Asking Price (₹) *</Label>
              <Input
                required type="number" min="1" max="10000000"
                placeholder="e.g. 45000"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>City *</Label>
              <Select required value={form.city} onValueChange={(v) => set("city", v)}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
            <button
              type="button"
              role="switch"
              aria-checked={form.isNegotiable}
              onClick={() => set("isNegotiable", !form.isNegotiable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isNegotiable ? "bg-success" : "bg-muted-foreground/30"
              }`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                form.isNegotiable ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
            <div>
              <p className="font-medium text-sm">Price is negotiable</p>
              <p className="text-xs text-muted-foreground">Buyers can send you offers</p>
            </div>
          </div>
        </section>

        {/* ── Section 3: Location ─────────────────────────────────────────── */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Location</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Pin your location so buyers know how far you are</p>
          </div>
          <LocationPickerMap value={location} onChange={setLocation} />
        </section>

        {/* ── Section 4: Contact & Meetup ─────────────────────────────────── */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact &amp; Meetup</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> Phone / WhatsApp
              </Label>
              <Input
                type="tel"
                placeholder="e.g. 9876543210"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">Shared only with interested buyers</p>
            </div>
            <div className="space-y-1.5">
              <Label>Meetup Preference</Label>
              <Select value={form.meetingPref} onValueChange={(v) => set("meetingPref", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MEETING_PREFS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* ── Section 5: Description ──────────────────────────────────────── */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Description</h2>
          <Textarea
            required
            rows={5}
            placeholder="Describe the item — specs, reason for selling, defects, accessories included…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={2000}
          />
          <p className="text-xs text-muted-foreground">{form.description.length}/2000</p>
        </section>

        {/* ── Section 6: Photos ───────────────────────────────────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Photos <span className="font-normal normal-case">(max {maxImages})</span>
            </h2>
            {!isPremium && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info className="h-3 w-3" /> Premium: up to 10 photos
              </span>
            )}
          </div>
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
            {images.length < maxImages && (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center hover:bg-muted transition-colors gap-1 disabled:opacity-50"
              >
                {uploading
                  ? <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  : <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-xs text-muted-foreground">Add</span></>}
              </button>
            )}
            {/* Hidden input — display:none prevents scroll-to-top on focus */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
          <p className="text-xs text-muted-foreground">First photo is the cover. Clear photos get 3× more responses.</p>
        </section>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm">
          <p className="font-semibold text-amber-800 mb-1">🚀 Boost after posting</p>
          <p className="text-amber-700 text-xs">Boost for ₹49–₹199 to appear in Featured and get 5× more views.</p>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading || uploading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Posting…</> : "Post Listing"}
        </Button>
      </form>
    </div>
  )
}
