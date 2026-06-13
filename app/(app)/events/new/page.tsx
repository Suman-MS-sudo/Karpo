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

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [form, setForm] = useState({
    title: "", description: "", category: "", date: "", location: "",
    maxParticipants: "", fee: "0",
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
      const res = await fetch("/api/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: new Date(form.date), fee: parseInt(form.fee), maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined, images }),
      })
      const d = await res.json()
      if (res.ok) router.push(`/events/${d.id}`)
      else alert(d.error)
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>
      <h1 className="text-2xl font-bold mb-6">Create an Event</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Event Title *</Label>
          <Input required placeholder="e.g. Weekend Trek to Nandi Hills" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select required value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {["TREK", "SPORTS", "NETWORKING", "HOBBY", "OTHER"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date & Time *</Label>
            <Input required type="datetime-local" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Location *</Label>
          <Input required placeholder="Full address or meeting point" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Max Participants</Label>
            <Input type="number" min="2" placeholder="20" value={form.maxParticipants} onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Entry Fee (₹)</Label>
            <Input type="number" min="0" placeholder="0 for free" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Description *</Label>
          <Textarea required rows={5} placeholder="Tell people what to expect…" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Cover Photo</Label>
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
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : "Create Event"}
        </Button>
      </form>
    </div>
  )
}
