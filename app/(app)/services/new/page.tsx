"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CITIES } from "@/config/services"

export default function NewServicePage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [portfolio, setPortfolio] = useState<string[]>([])
  const [form, setForm] = useState({
    category: "",
    title: "",
    description: "",
    priceType: "",
    price: "",
    city: session?.user?.city ?? "",
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (data.url) setPortfolio((prev) => [...prev, data.url])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: form.price ? parseInt(form.price) : undefined, portfolio }),
      })
      const data = await res.json()
      if (res.ok) router.push(`/services/${data.id}`)
      else alert(data.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/services" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Skill Marketplace
      </Link>
      <h1 className="text-2xl font-bold mb-6">List Your Service</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <Select required value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {["PHOTOGRAPHY", "CODING", "DESIGN", "TAX", "CONSULTING", "COACHING", "OTHER"].map((c) => (
                <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Service Title *</Label>
          <Input required placeholder="e.g. Professional headshots and LinkedIn photos" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <Label>Description *</Label>
          <Textarea required rows={5} placeholder="Describe your service, what's included, your experience…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Pricing Type *</Label>
            <Select required value={form.priceType} onValueChange={(v) => setForm((f) => ({ ...f, priceType: v }))}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">Fixed</SelectItem>
                <SelectItem value="HOURLY">Hourly</SelectItem>
                <SelectItem value="NEGOTIABLE">Negotiable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.priceType !== "NEGOTIABLE" && (
            <div className="space-y-1.5 col-span-2">
              <Label>Price (₹) {form.priceType === "HOURLY" ? "per hour" : ""}</Label>
              <Input type="number" min="0" placeholder="2000" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>City <span className="text-muted-foreground font-normal">optional</span></Label>
          <Select value={form.city} onValueChange={(v) => setForm((f) => ({ ...f, city: v }))}>
            <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
            <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Portfolio Images <span className="text-muted-foreground font-normal">optional</span></Label>
          <div className="grid grid-cols-4 gap-2">
            {portfolio.map((img, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setPortfolio((p) => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="aspect-square rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="sr-only" />
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Listing…</> : "List Service"}
        </Button>
      </form>
    </div>
  )
}
