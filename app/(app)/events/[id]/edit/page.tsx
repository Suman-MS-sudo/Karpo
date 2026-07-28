"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2, Plus, Trash2, MapPin, Video, Globe } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TimeSelect } from "@/components/events/TimeSelect"
import { cn } from "@/lib/utils"

type EventFormat = "IN_PERSON" | "ONLINE" | "HYBRID"

type AgendaItem = { time: string; title: string; speaker: string }

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(true)
  const [images,   setImages]   = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [agenda,   setAgenda]   = useState<AgendaItem[]>([])
  const [form, setForm] = useState({
    title: "", description: "", category: "", date: "", location: "",
    maxParticipants: "", fee: "0", onlineLink: "", tags: [] as string[],
    requiresApproval: false, isActive: true, format: "IN_PERSON" as EventFormat,
  })
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/events/${id}`)
      .then((r) => r.json())
      .then((ev) => {
        const d = new Date(ev.date)
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}T${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
        setForm({
          title: ev.title ?? "", description: ev.description ?? "",
          category: ev.category ?? "", date: dateStr,
          location: ev.location ?? "", maxParticipants: ev.maxParticipants ? String(ev.maxParticipants) : "",
          fee: String(ev.fee ?? 0), onlineLink: ev.onlineLink ?? "",
          tags: ev.tags ?? [], requiresApproval: ev.requiresApproval ?? false, isActive: ev.isActive ?? true,
          format: (ev.format as EventFormat) ?? "IN_PERSON",
        })
        setImages(ev.images ?? [])
        setAgenda((ev.agenda ?? []).map((a: any) => ({ time: a.time ?? "", title: a.title ?? "", speaker: a.speaker ?? "" })))
        setFetching(false)
      })
      .catch(() => setFetching(false))
  }, [id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d = await res.json()
      if (d.url) setImages((p) => [...p, d.url])
    }
  }

  const addTag = () => {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) setForm((f) => ({ ...f, tags: [...f.tags, t] }))
    setTagInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("")
    if (form.format !== "ONLINE" && !form.location.trim()) { setError("Please enter a venue / address"); return }
    if (form.format !== "IN_PERSON" && !form.onlineLink.trim()) { setError("Please add a meeting link"); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fee: parseInt(form.fee),
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
          images,
          agenda: agenda.filter((a) => a.title).map((a) => ({ time: a.time, title: a.title, speaker: a.speaker || undefined })),
        }),
      })
      const d = await res.json()
      if (res.ok) router.push(`/events/${id}`)
      else alert(d.error)
    } finally { setLoading(false) }
  }

  if (fetching) return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/events/${id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>
      <h1 className="text-2xl font-black mb-6 bg-gradient-to-r from-fuchsia-600 to-cyan-500 bg-clip-text text-transparent">✏️ Edit Event</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic */}
        <div className="bg-card border-2 border-border rounded-3xl p-5 space-y-4 hover:border-fuchsia-300/50 dark:hover:border-fuchsia-800/50 transition-colors">
          <h2 className="font-bold flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" /> Event Details
          </h2>
          <div className="space-y-1.5">
            <Label>Event Title *</Label>
            <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select required value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["TREK","SPORTS","NETWORKING","HOBBY","OTHER"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date & Time *</Label>
              <Input required type="datetime-local" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Format</Label>
            <div className="flex gap-2">
              {([
                { value: "IN_PERSON", label: "In Person", Icon: MapPin },
                { value: "ONLINE",    label: "Online",    Icon: Video  },
                { value: "HYBRID",    label: "Hybrid",    Icon: Globe  },
              ] as const).map(({ value, label, Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, format: value }))}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border text-sm font-semibold transition-all",
                    form.format === value ? "bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-white border-transparent shadow-sm" : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>
          {form.format !== "ONLINE" && (
            <div className="space-y-1.5">
              <Label>Location *</Label>
              <Input required value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Full address or meeting point" />
            </div>
          )}
          {form.format !== "IN_PERSON" && (
            <div className="space-y-1.5">
              <Label>Online Meeting Link *</Label>
              <Input required type="url" value={form.onlineLink} onChange={(e) => setForm((f) => ({ ...f, onlineLink: e.target.value }))} placeholder="https://meet.google.com/..." />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max Participants</Label>
              <Input type="number" min="2" value={form.maxParticipants} onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))} onWheel={(e) => e.currentTarget.blur()} placeholder="Unlimited" />
            </div>
            <div className="space-y-1.5">
              <Label>Entry Fee (₹)</Label>
              <Input type="number" min="0" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} onWheel={(e) => e.currentTarget.blur()} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea required rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={form.requiresApproval} onChange={(e) => setForm((f) => ({ ...f, requiresApproval: e.target.checked }))} className="rounded" />
              Require approval before confirming RSVP
            </label>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-card border-2 border-border rounded-3xl p-5 space-y-3 hover:border-fuchsia-300/50 dark:hover:border-fuchsia-800/50 transition-colors">
          <h2 className="font-bold flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" /> Tags
          </h2>
          <div className="flex gap-2">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }} placeholder="Add tag (Enter to add)" />
            <Button type="button" variant="outline" onClick={addTag}>Add</Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                  {t}<button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))}><X className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Agenda */}
        <div className="bg-card border-2 border-border rounded-3xl p-5 space-y-4 hover:border-fuchsia-300/50 dark:hover:border-fuchsia-800/50 transition-colors">
          <div className="flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" /> Agenda <span className="text-xs font-normal text-muted-foreground">(optional)</span>
            </h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setAgenda((a) => [...a, { time: "", title: "", speaker: "" }])}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add item
            </Button>
          </div>
          {agenda.map((item, i) => (
            <div key={i} className="grid grid-cols-[80px_1fr_1fr_auto] gap-2 items-start">
              <Input value={item.time} onChange={(e) => setAgenda((a) => a.map((x, j) => j === i ? { ...x, time: e.target.value } : x))} placeholder="10:00 AM" />
              <Input value={item.title} onChange={(e) => setAgenda((a) => a.map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Session title" />
              <Input value={item.speaker} onChange={(e) => setAgenda((a) => a.map((x, j) => j === i ? { ...x, speaker: e.target.value } : x))} placeholder="Speaker (optional)" />
              <Button type="button" variant="ghost" size="icon" onClick={() => setAgenda((a) => a.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {agenda.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No agenda items yet.</p>}
        </div>

        {/* Images */}
        <div className="bg-card border-2 border-border rounded-3xl p-5 space-y-3 hover:border-fuchsia-300/50 dark:hover:border-fuchsia-800/50 transition-colors">
          <h2 className="font-bold flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-400" /> Cover Photo
          </h2>
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
            {images.length < 3 && (
              <label className="h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <input type="file" accept="image/*" onChange={handleImageUpload} className="sr-only" />
              </label>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-card border-2 border-border rounded-3xl p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
            <div>
              <p className="font-medium text-sm">Event is active</p>
              <p className="text-xs text-muted-foreground">Uncheck to cancel the event</p>
            </div>
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" className="flex-1 rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 border-0 hover:brightness-110 shadow-[0_4px_20px_rgba(217,70,239,0.35)] font-bold" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" className="rounded-full text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30" asChild>
            <Link href={`/events/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
