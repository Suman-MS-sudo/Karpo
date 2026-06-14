"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AgendaItem { time: string; title: string; speaker: string }

export default function NewEventPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [images,  setImages]  = useState<string[]>([])
  const [tags,    setTags]    = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [agenda,  setAgenda]  = useState<AgendaItem[]>([])
  const [form, setForm] = useState({
    title: "", description: "", category: "", date: "", location: "",
    maxParticipants: "", fee: "0", onlineLink: "", requiresApproval: false,
  })

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d   = await res.json()
      if (d.url) setImages((p) => [...p, d.url])
    }
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) { setTags((p) => [...p, t]); setTagInput("") }
  }

  const addAgendaItem = () =>
    setAgenda((p) => [...p, { time: "", title: "", speaker: "" }])

  const updateAgenda = (i: number, k: keyof AgendaItem, v: string) =>
    setAgenda((p) => p.map((a, j) => j === i ? { ...a, [k]: v } : a))

  const removeAgenda = (i: number) =>
    setAgenda((p) => p.filter((_, j) => j !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch("/api/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date:            new Date(form.date),
          fee:             parseInt(form.fee) || 0,
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
          images,
          tags,
          agenda:          agenda.filter((a) => a.title),
          onlineLink:      form.onlineLink || undefined,
        }),
      })
      const d = await res.json()
      if (res.ok) router.push(`/events/${d.id}`)
      else alert(d.error ?? "Failed to create event")
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Events
      </Link>
      <h1 className="text-2xl font-bold mb-2">Create an Event</h1>
      <p className="text-muted-foreground text-sm mb-6">Fill in the details — you can edit everything after publishing.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>
          <div className="space-y-1.5">
            <Label>Event Title *</Label>
            <Input required placeholder="e.g. Weekend Trek to Nandi Hills" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select required value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TREK">🥾 Trek</SelectItem>
                  <SelectItem value="SPORTS">⚽ Sports</SelectItem>
                  <SelectItem value="NETWORKING">🤝 Networking</SelectItem>
                  <SelectItem value="HOBBY">🎨 Hobby</SelectItem>
                  <SelectItem value="OTHER">📦 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date & Time *</Label>
              <Input required type="datetime-local" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Location *</Label>
            <Input required placeholder="Full address or meeting point" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea required rows={4} placeholder="What will attendees experience? What to bring? What's the plan?" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        {/* Capacity & Fees */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Capacity & Fees</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max Participants</Label>
              <Input type="number" min="2" placeholder="Unlimited" value={form.maxParticipants} onChange={(e) => set("maxParticipants", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Entry Fee (₹)</Label>
              <Input type="number" min="0" placeholder="0 for free" value={form.fee} onChange={(e) => set("fee", e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="requiresApproval"
              checked={form.requiresApproval}
              onChange={(e) => set("requiresApproval", e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="requiresApproval" className="cursor-pointer">
              Require approval before confirming RSVPs
            </Label>
          </div>
        </div>

        {/* Online / Hybrid */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Online / Hybrid</h2>
          <div className="space-y-1.5">
            <Label>Online Meeting Link (optional)</Label>
            <Input
              type="url"
              placeholder="https://meet.google.com/... or Zoom link"
              value={form.onlineLink}
              onChange={(e) => set("onlineLink", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Shared only with attendees who have RSVP'd</p>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Tags</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag (e.g. Outdoor, Beginner-friendly)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
            />
            <Button type="button" variant="outline" onClick={addTag}>Add</Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                  {t}
                  <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="ml-0.5 text-muted-foreground hover:text-red-500"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Agenda */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Agenda (optional)</h2>
            <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add Item
            </Button>
          </div>
          {agenda.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agenda items yet. Add times, sessions, or activities for your event.</p>
          ) : (
            <div className="space-y-3">
              {agenda.map((item, i) => (
                <div key={i} className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Time</Label>
                    <Input placeholder="10:00" value={item.time} onChange={(e) => updateAgenda(i, "time", e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Session / Activity *</Label>
                    <Input required placeholder="Opening remarks" value={item.title} onChange={(e) => updateAgenda(i, "title", e.target.value)} className="h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Speaker (optional)</Label>
                    <Input placeholder="John Doe" value={item.speaker} onChange={(e) => updateAgenda(i, "speaker", e.target.value)} className="h-9 text-sm" />
                  </div>
                  <button type="button" onClick={() => removeAgenda(i)} className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-500 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cover Photo */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Cover Photo</h2>
          <div className="flex gap-2 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute top-0.5 right-0.5 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center">
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            {images.length === 0 && (
              <label className="h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
              </label>
            )}
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating…</> : "Create Event"}
        </Button>
      </form>
    </div>
  )
}
