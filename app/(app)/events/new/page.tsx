"use client"
import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, Upload, X, Loader2, Plus, Trash2, MapPin, Clock,
  Users, IndianRupee, Link2, Tag, ListChecks, Image as ImageIcon,
  Mountain, Trophy, Handshake, Palette, MoreHorizontal, Calendar,
  ChevronRight, CheckCircle2, Globe, Lock, Video,
  Music, Mic2, UtensilsCrossed, Heart, Cpu, Hammer, Gamepad2,
  Clapperboard, Dumbbell, BookOpen, Plane, Brush,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AgendaItem { time: string; title: string; speaker: string }

const CATEGORIES = [
  { value: "TREK",       label: "Trek",        Icon: Mountain,       iconColor: "text-emerald-600 dark:text-emerald-400", iconBg: "bg-emerald-100 dark:bg-emerald-500/20", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-200 dark:border-emerald-800", active: "ring-emerald-500",  text: "text-emerald-700 dark:text-emerald-300" },
  { value: "SPORTS",     label: "Sports",      Icon: Trophy,         iconColor: "text-blue-600 dark:text-blue-400",       iconBg: "bg-blue-100 dark:bg-blue-500/20",       bg: "bg-blue-50 dark:bg-blue-950/30",       border: "border-blue-200 dark:border-blue-800",       active: "ring-blue-500",    text: "text-blue-700 dark:text-blue-300"       },
  { value: "NETWORKING", label: "Networking",  Icon: Handshake,      iconColor: "text-violet-600 dark:text-violet-400",   iconBg: "bg-violet-100 dark:bg-violet-500/20",   bg: "bg-violet-50 dark:bg-violet-950/30",   border: "border-violet-200 dark:border-violet-800",   active: "ring-violet-500",  text: "text-violet-700 dark:text-violet-300"   },
  { value: "MUSIC",      label: "Music",       Icon: Music,          iconColor: "text-purple-600 dark:text-purple-400",   iconBg: "bg-purple-100 dark:bg-purple-500/20",   bg: "bg-purple-50 dark:bg-purple-950/30",   border: "border-purple-200 dark:border-purple-800",   active: "ring-purple-500",  text: "text-purple-700 dark:text-purple-300"   },
  { value: "COMEDY",     label: "Standup",     Icon: Mic2,           iconColor: "text-orange-600 dark:text-orange-400",   iconBg: "bg-orange-100 dark:bg-orange-500/20",   bg: "bg-orange-50 dark:bg-orange-950/30",   border: "border-orange-200 dark:border-orange-800",   active: "ring-orange-500",  text: "text-orange-700 dark:text-orange-300"   },
  { value: "FOOD",       label: "Food",        Icon: UtensilsCrossed,iconColor: "text-yellow-600 dark:text-yellow-400",   iconBg: "bg-yellow-100 dark:bg-yellow-500/20",   bg: "bg-yellow-50 dark:bg-yellow-950/30",   border: "border-yellow-200 dark:border-yellow-800",   active: "ring-yellow-500",  text: "text-yellow-700 dark:text-yellow-300"   },
  { value: "WELLNESS",   label: "Wellness",    Icon: Heart,          iconColor: "text-pink-600 dark:text-pink-400",       iconBg: "bg-pink-100 dark:bg-pink-500/20",       bg: "bg-pink-50 dark:bg-pink-950/30",       border: "border-pink-200 dark:border-pink-800",       active: "ring-pink-500",    text: "text-pink-700 dark:text-pink-300"       },
  { value: "TECH",       label: "Tech",        Icon: Cpu,            iconColor: "text-cyan-600 dark:text-cyan-400",       iconBg: "bg-cyan-100 dark:bg-cyan-500/20",       bg: "bg-cyan-50 dark:bg-cyan-950/30",       border: "border-cyan-200 dark:border-cyan-800",       active: "ring-cyan-500",    text: "text-cyan-700 dark:text-cyan-300"       },
  { value: "WORKSHOP",   label: "Workshop",    Icon: Hammer,         iconColor: "text-slate-600 dark:text-slate-400",     iconBg: "bg-slate-100 dark:bg-slate-500/20",     bg: "bg-slate-50 dark:bg-slate-950/30",     border: "border-slate-200 dark:border-slate-700",     active: "ring-slate-500",   text: "text-slate-700 dark:text-slate-300"     },
  { value: "GAMING",     label: "Gaming",      Icon: Gamepad2,       iconColor: "text-indigo-600 dark:text-indigo-400",   iconBg: "bg-indigo-100 dark:bg-indigo-500/20",   bg: "bg-indigo-50 dark:bg-indigo-950/30",   border: "border-indigo-200 dark:border-indigo-800",   active: "ring-indigo-500",  text: "text-indigo-700 dark:text-indigo-300"   },
  { value: "MOVIE",      label: "Movie",       Icon: Clapperboard,   iconColor: "text-red-600 dark:text-red-400",         iconBg: "bg-red-100 dark:bg-red-500/20",         bg: "bg-red-50 dark:bg-red-950/30",         border: "border-red-200 dark:border-red-800",         active: "ring-red-500",     text: "text-red-700 dark:text-red-300"         },
  { value: "FITNESS",    label: "Fitness",     Icon: Dumbbell,       iconColor: "text-lime-600 dark:text-lime-400",       iconBg: "bg-lime-100 dark:bg-lime-500/20",       bg: "bg-lime-50 dark:bg-lime-950/30",       border: "border-lime-200 dark:border-lime-800",       active: "ring-lime-500",    text: "text-lime-700 dark:text-lime-300"       },
  { value: "HOBBY",      label: "Hobby",       Icon: Palette,        iconColor: "text-rose-600 dark:text-rose-400",       iconBg: "bg-rose-100 dark:bg-rose-500/20",       bg: "bg-rose-50 dark:bg-rose-950/30",       border: "border-rose-200 dark:border-rose-800",       active: "ring-rose-500",    text: "text-rose-700 dark:text-rose-300"       },
  { value: "TRAVEL",     label: "Travel",      Icon: Plane,          iconColor: "text-sky-600 dark:text-sky-400",         iconBg: "bg-sky-100 dark:bg-sky-500/20",         bg: "bg-sky-50 dark:bg-sky-950/30",         border: "border-sky-200 dark:border-sky-800",         active: "ring-sky-500",     text: "text-sky-700 dark:text-sky-300"         },
  { value: "OTHER",      label: "Other",       Icon: MoreHorizontal, iconColor: "text-amber-600 dark:text-amber-400",     iconBg: "bg-amber-100 dark:bg-amber-500/20",     bg: "bg-amber-50 dark:bg-amber-950/30",     border: "border-amber-200 dark:border-amber-800",     active: "ring-amber-500",   text: "text-amber-700 dark:text-amber-300"     },
]

const STEPS = [
  { id: "basics",  label: "Basics",  Icon: Calendar   },
  { id: "details", label: "Details", Icon: ListChecks },
  { id: "media",   label: "Media",   Icon: ImageIcon  },
]

function MapEmbed({ location }: { location: string }) {
  if (!location.trim()) return null
  const q = encodeURIComponent(location)
  return (
    <div className="rounded-xl overflow-hidden border border-border h-[200px] w-full mt-2">
      <iframe
        title="Event location"
        src={`https://maps.google.com/maps?q=${q}&output=embed&z=15`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("bg-card border border-border rounded-2xl p-6 space-y-5", className)}>
      {children}
    </div>
  )
}

function SectionTitle({ Icon, children }: { Icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-border">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{children}</h2>
    </div>
  )
}

export default function NewEventPage() {
  const router    = useRouter()
  const fileRef   = useRef<HTMLInputElement>(null)
  const [loading,   setLoading]  = useState(false)
  const [dragging,  setDragging] = useState(false)
  const [images,    setImages]   = useState<string[]>([])
  const [tags,      setTags]     = useState<string[]>([])
  const [tagInput,  setTagInput] = useState("")
  const [agenda,    setAgenda]   = useState<AgendaItem[]>([])
  const [mapKey,    setMapKey]   = useState(0)
  const [form, setForm] = useState({
    title: "", description: "", category: "", date: "", time: "",
    location: "", maxParticipants: "", fee: "0", onlineLink: "",
    requiresApproval: false, isOnline: false,
  })

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }))

  // ── Image upload ────────────────────────────────────────────────────────────
  const uploadFiles = async (files: File[]) => {
    for (const file of files) {
      const fd = new FormData(); fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const d   = await res.json()
      if (d.url) setImages((p) => [...p, d.url])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) =>
    uploadFiles(Array.from(e.target.files ?? []))

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    uploadFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith("image/")))
  }, [])

  // ── Tags ────────────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) { setTags((p) => [...p, t]); setTagInput("") }
  }

  // ── Agenda ──────────────────────────────────────────────────────────────────
  const addAgendaItem  = () => setAgenda((p) => [...p, { time: "", title: "", speaker: "" }])
  const updateAgenda   = (i: number, k: keyof AgendaItem, v: string) =>
    setAgenda((p) => p.map((a, j) => j === i ? { ...a, [k]: v } : a))
  const removeAgenda   = (i: number) => setAgenda((p) => p.filter((_, j) => j !== i))

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const dateTime = form.date && form.time ? `${form.date}T${form.time}` : form.date
      const res = await fetch("/api/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:           form.title,
          description:     form.description,
          category:        form.category,
          date:            new Date(dateTime),
          location:        form.location,
          fee:             parseInt(form.fee) || 0,
          maxParticipants: form.maxParticipants ? parseInt(form.maxParticipants) : undefined,
          images, tags,
          agenda:          agenda.filter((a) => a.title),
          onlineLink:      form.onlineLink || undefined,
          requiresApproval: form.requiresApproval,
        }),
      })
      const d = await res.json()
      if (res.ok) router.push(`/events/${d.id}`)
      else alert(d.error ?? "Failed to create event")
    } finally { setLoading(false) }
  }

  const selectedCat = CATEGORIES.find(c => c.value === form.category)
  const feeNum      = parseInt(form.fee) || 0
  const dateDisplay = form.date && form.time
    ? new Date(`${form.date}T${form.time}`).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : form.date ? new Date(form.date).toLocaleDateString("en-IN", { dateStyle: "medium" }) : null

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/events" className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Events</span>
          </Link>
          <h1 className="text-sm font-semibold">Create Event</h1>
          <Button type="submit" form="event-form" size="sm" disabled={loading} className="gap-1.5">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            {loading ? "Publishing…" : "Publish"}
          </Button>
        </div>
      </div>

      <form id="event-form" onSubmit={handleSubmit}>
        <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">

          {/* ── LEFT: Form ───────────────────────────────────────────────── */}
          <div className="space-y-6 min-w-0">

            {/* Cover photo — hero upload */}
            <div
              className={cn(
                "relative rounded-2xl border-2 border-dashed overflow-hidden transition-all group cursor-pointer",
                dragging ? "border-primary-500 bg-primary-50 dark:bg-primary-950/20" : "border-border hover:border-muted-foreground/40",
                images[0] ? "h-[240px]" : "h-[180px]"
              )}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              {images[0] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images[0]} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <span className="text-xs text-white/80 font-medium">Cover Photo</span>
                    <div className="flex gap-2">
                      {images.slice(1).map((img, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={i} src={img} alt="" className="h-10 w-10 rounded-lg object-cover border-2 border-white/50" />
                      ))}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
                        className="h-10 w-10 rounded-lg bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center hover:bg-white/30 transition-colors"
                      >
                        <Plus className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setImages([]) }}
                    className="absolute top-3 right-3 h-7 w-7 rounded-full bg-black/40 backdrop-blur flex items-center justify-center hover:bg-red-500/80 transition-colors"
                  >
                    <X className="h-3.5 w-3.5 text-white" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Drop a cover photo here</p>
                    <p className="text-xs text-muted-foreground mt-0.5">or click to browse · PNG, JPG up to 10 MB</p>
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileInput} className="sr-only" />
            </div>

            {/* Basic Info */}
            <SectionCard>
              <SectionTitle Icon={Calendar}>Event Details</SectionTitle>

              {/* Title */}
              <div className="space-y-1.5">
                <Label>Event Title <span className="text-red-500">*</span></Label>
                <Input
                  required
                  placeholder="e.g. Weekend Trek to Nandi Hills"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className="text-base h-11"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
                  {CATEGORIES.map((cat) => {
                    const active = form.category === cat.value
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        onClick={() => set("category", cat.value)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center",
                          active
                            ? `${cat.bg} ${cat.border} ring-2 ${cat.active} ring-offset-1 ring-offset-background`
                            : "border-border hover:border-muted-foreground/40 hover:bg-muted/50"
                        )}
                      >
                        <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center transition-colors", active ? cat.iconBg : "bg-muted")}>
                          <cat.Icon className={cn("h-4.5 w-4.5", active ? cat.iconColor : "text-muted-foreground")} style={{ width: 18, height: 18 }} />
                        </div>
                        <span className={cn("text-[11px] font-medium leading-tight", active ? cat.text : "text-muted-foreground")}>
                          {cat.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Date <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      required
                      type="date"
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Time <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      required
                      type="time"
                      value={form.time}
                      onChange={(e) => set("time", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Description <span className="text-red-500">*</span></Label>
                  <span className="text-xs text-muted-foreground">{form.description.length} chars</span>
                </div>
                <Textarea
                  required
                  rows={5}
                  placeholder="What will attendees experience? What to bring? What's the plan?"
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="resize-none"
                />
              </div>
            </SectionCard>

            {/* Location */}
            <SectionCard>
              <SectionTitle Icon={MapPin}>Location</SectionTitle>

              {/* Online toggle */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => set("isOnline", false)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    !form.isOnline ? "bg-primary-600 text-white border-primary-600" : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  <MapPin className="h-4 w-4" /> In Person
                </button>
                <button
                  type="button"
                  onClick={() => set("isOnline", true)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all",
                    form.isOnline ? "bg-primary-600 text-white border-primary-600" : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  )}
                >
                  <Video className="h-4 w-4" /> Online
                </button>
                <button
                  type="button"
                  onClick={() => { set("isOnline", false) }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:border-muted-foreground/40 transition-all"
                >
                  <Globe className="h-4 w-4" /> Hybrid
                </button>
              </div>

              <div className="space-y-1.5">
                <Label>Venue / Address {!form.isOnline && <span className="text-red-500">*</span>}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    required={!form.isOnline}
                    placeholder="Search for a venue or enter full address"
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    onBlur={() => setMapKey(k => k + 1)}
                    className="pl-9"
                  />
                </div>
                {form.location && <MapEmbed key={mapKey} location={form.location} />}
              </div>

              {(form.isOnline || form.onlineLink) && (
                <div className="space-y-1.5">
                  <Label>Meeting Link</Label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="url"
                      placeholder="https://meet.google.com/... or Zoom link"
                      value={form.onlineLink}
                      onChange={(e) => set("onlineLink", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Lock className="h-3 w-3" /> Shared only with RSVP'd attendees
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Capacity & Fees */}
            <SectionCard>
              <SectionTitle Icon={Users}>Capacity & Fees</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Max Participants</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="number" min="2"
                      placeholder="Unlimited"
                      value={form.maxParticipants}
                      onChange={(e) => set("maxParticipants", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Entry Fee</Label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="number" min="0"
                      placeholder="0 for free"
                      value={form.fee}
                      onChange={(e) => set("fee", e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>
              <label className="flex items-start gap-3 p-3 rounded-xl border border-border hover:bg-muted/40 cursor-pointer transition-colors group">
                <div className={cn(
                  "mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors",
                  form.requiresApproval ? "bg-primary-600 border-primary-600" : "border-muted-foreground/40 group-hover:border-muted-foreground"
                )}>
                  {form.requiresApproval && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  checked={form.requiresApproval}
                  onChange={(e) => set("requiresApproval", e.target.checked)}
                  className="sr-only"
                />
                <div>
                  <p className="text-sm font-medium">Require RSVP approval</p>
                  <p className="text-xs text-muted-foreground mt-0.5">You'll manually approve each attendee before they're confirmed</p>
                </div>
              </label>
            </SectionCard>

            {/* Tags */}
            <SectionCard>
              <SectionTitle Icon={Tag}>Tags</SectionTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Add a tag (e.g. Outdoor, Beginner-friendly)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                    className="pl-9"
                  />
                </div>
                <Button type="button" variant="outline" onClick={addTag}>Add</Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((t) => (
                    <span key={t} className="flex items-center gap-1.5 text-xs bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-full font-medium">
                      {t}
                      <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="hover:text-red-500 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">Tags help people discover your event. Try: "Outdoor", "Networking", "Free", "Weekend"</p>
            </SectionCard>

            {/* Agenda */}
            <SectionCard>
              <div className="flex items-center justify-between">
                <SectionTitle Icon={ListChecks}>Agenda</SectionTitle>
                <Button type="button" variant="outline" size="sm" onClick={addAgendaItem} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Item
                </Button>
              </div>
              {agenda.length === 0 ? (
                <button
                  type="button"
                  onClick={addAgendaItem}
                  className="w-full py-5 border-2 border-dashed border-border rounded-xl flex flex-col items-center gap-2 text-muted-foreground hover:border-muted-foreground/40 hover:bg-muted/30 transition-all"
                >
                  <ListChecks className="h-6 w-6" />
                  <span className="text-sm">Add a schedule or agenda for your event</span>
                </button>
              ) : (
                <div className="space-y-3">
                  {agenda.map((item, i) => (
                    <div key={i} className="relative pl-8">
                      {/* timeline dot */}
                      <div className="absolute left-2.5 top-3 h-2 w-2 rounded-full bg-primary-400 ring-4 ring-primary-100 dark:ring-primary-900" />
                      {i < agenda.length - 1 && (
                        <div className="absolute left-[13px] top-5 bottom-0 w-px bg-border" />
                      )}
                      <div className="bg-muted/40 border border-border rounded-xl p-3 space-y-2">
                        <div className="grid grid-cols-[90px_1fr] gap-2">
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Time</p>
                            <div className="relative">
                              <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
                              <Input placeholder="10:00" value={item.time} onChange={(e) => updateAgenda(i, "time", e.target.value)} className="h-8 pl-6 text-xs" />
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-muted-foreground mb-1">Session / Activity</p>
                            <Input required placeholder="e.g. Opening remarks" value={item.title} onChange={(e) => updateAgenda(i, "title", e.target.value)} className="h-8 text-sm" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input placeholder="Speaker or host (optional)" value={item.speaker} onChange={(e) => updateAgenda(i, "speaker", e.target.value)} className="h-8 text-sm" />
                          <button type="button" onClick={() => removeAgenda(i)} className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Mobile publish button — only visible when right column is below fold */}
            <div className="lg:hidden">
              <Button type="submit" form="event-form" className="w-full gap-2" size="lg" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {loading ? "Publishing…" : "Publish Event"}
              </Button>
            </div>
          </div>

          {/* ── RIGHT: Live Preview ───────────────────────────────────────── */}
          <div className="hidden lg:block lg:sticky lg:top-[72px] space-y-4">

            {/* Preview card */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              {/* Preview cover */}
              <div className="relative h-40 bg-gradient-to-br from-muted to-muted/50 overflow-hidden">
                {images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images[0]} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                {selectedCat && (
                  <div className="absolute top-3 left-3">
                    <span className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur border", selectedCat.bg, selectedCat.border, selectedCat.text)}>
                      <selectedCat.Icon style={{ width: 12, height: 12 }} />
                      {selectedCat.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-base leading-snug">
                  {form.title || <span className="text-muted-foreground italic font-normal text-sm">Event title will appear here</span>}
                </h3>

                {dateDisplay && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>{dateDisplay}</span>
                  </div>
                )}

                {form.location && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{form.location}</span>
                  </div>
                )}

                {/* Fee / Capacity pills */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className={cn(
                    "text-xs font-medium px-2.5 py-1 rounded-full border",
                    feeNum === 0
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300"
                  )}>
                    {feeNum === 0 ? "Free" : `₹${feeNum}`}
                  </span>
                  {form.maxParticipants && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-border bg-muted text-muted-foreground">
                      {form.maxParticipants} seats
                    </span>
                  )}
                  {form.requiresApproval && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300">
                      Approval required
                    </span>
                  )}
                </div>

                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {tags.map(t => (
                      <span key={t} className="text-[11px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Checklist */}
            <div className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Event checklist</p>
              {[
                { done: !!form.title,             label: "Event title"    },
                { done: !!form.category,          label: "Category"       },
                { done: !!(form.date && form.time), label: "Date & time"  },
                { done: !!form.location,          label: "Location"       },
                { done: !!form.description,       label: "Description"    },
                { done: images.length > 0,        label: "Cover photo"    },
              ].map(({ done, label }) => (
                <div key={label} className="flex items-center gap-2.5">
                  <div className={cn(
                    "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                    done ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground/30"
                  )}>
                    {done && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                  </div>
                  <span className={cn("text-sm", done ? "text-foreground line-through opacity-60" : "text-muted-foreground")}>{label}</span>
                </div>
              ))}
            </div>

            <Button type="submit" form="event-form" className="w-full gap-2" size="lg" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {loading ? "Publishing…" : "Publish Event"}
            </Button>
            <p className="text-xs text-center text-muted-foreground">You can edit all details after publishing</p>
          </div>
        </div>
      </form>
    </div>
  )
}
