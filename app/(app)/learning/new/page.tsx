"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NewCoursePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [form, setForm] = useState({
    title: "", description: "", category: "", price: "0",
    duration: "", mode: "", schedule: "",
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (d.url) setImages((p) => [...p, d.url])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch("/api/learning", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: parseInt(form.price), images }),
      })
      const d = await res.json()
      if (res.ok) router.push(`/learning/${d.id}`)
      else alert(d.error)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/learning" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Learning Hub
      </Link>
      <h1 className="text-2xl font-bold mb-6">List a Course or Workshop</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input required placeholder="e.g. Advanced Python for Data Engineers" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Input required placeholder="e.g. Programming, Finance" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Mode *</Label>
            <Select required value={form.mode} onValueChange={(v) => setForm((f) => ({ ...f, mode: v }))}>
              <SelectTrigger><SelectValue placeholder="Mode" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE">Online</SelectItem>
                <SelectItem value="OFFLINE">Offline</SelectItem>
                <SelectItem value="HYBRID">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Duration *</Label>
            <Input required placeholder="e.g. 8 hours / 4 weeks" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Price (₹)</Label>
            <Input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Schedule *</Label>
          <Input required placeholder="e.g. Saturdays 10am–12pm, starting Jan 15" value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Description *</Label>
          <Textarea required rows={5} placeholder="What will participants learn? Prerequisites? What's included?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Cover Image</Label>
          <div className="flex gap-2">
            {images.map((img, i) => <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center"><X className="h-2.5 w-2.5" /></button>
            </div>)}
            {images.length === 0 && <label className="h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
            </label>}
          </div>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Listing…</> : "List Course"}
        </Button>
      </form>
    </div>
  )
}
