"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Upload, X, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Module = { module: string; topics: string[]; durationMins: string }

export default function EditCoursePage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params.id as string

  const [loading,    setLoading]    = useState(false)
  const [fetching,   setFetching]   = useState(true)
  const [images,     setImages]     = useState<string[]>([])
  const [tagInput,   setTagInput]   = useState("")
  const [modules,    setModules]    = useState<Module[]>([])
  const [form, setForm] = useState({
    title: "", description: "", category: "", price: "0", duration: "",
    mode: "", schedule: "", level: "BEGINNER", prerequisites: "",
    maxStudents: "", certificate: false, language: "English",
    tags: [] as string[], isActive: true,
  })

  useEffect(() => {
    fetch(`/api/learning/${id}`)
      .then((r) => r.json())
      .then((c) => {
        setForm({
          title: c.title ?? "", description: c.description ?? "",
          category: c.category ?? "", price: String(c.price ?? 0),
          duration: c.duration ?? "", mode: c.mode ?? "", schedule: c.schedule ?? "",
          level: c.level ?? "BEGINNER", prerequisites: c.prerequisites ?? "",
          maxStudents: c.maxStudents ? String(c.maxStudents) : "",
          certificate: c.certificate ?? false, language: c.language ?? "English",
          tags: c.tags ?? [], isActive: c.isActive ?? true,
        })
        setImages(c.images ?? [])
        setModules((c.curriculum ?? []).map((m: any) => ({
          module: m.module ?? "", topics: m.topics ?? [], durationMins: String(m.durationMins ?? ""),
        })))
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
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }))
    }
    setTagInput("")
  }

  const addModule = () => setModules((m) => [...m, { module: "", topics: [""], durationMins: "" }])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const curriculum = modules.filter((m) => m.module).map((m) => ({
        module: m.module,
        topics: m.topics.filter(Boolean),
        durationMins: m.durationMins ? parseInt(m.durationMins) : undefined,
      }))
      const res = await fetch(`/api/learning/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: parseInt(form.price),
          maxStudents: form.maxStudents ? parseInt(form.maxStudents) : undefined,
          images,
          curriculum: curriculum.length ? curriculum : undefined,
        }),
      })
      const d = await res.json()
      if (res.ok) router.push(`/learning/${id}`)
      else alert(d.error)
    } finally { setLoading(false) }
  }

  if (fetching) {
    return <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/learning/${id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to course
      </Link>
      <h1 className="text-2xl font-bold mb-6">Edit Course</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Basic Information</h2>
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Input required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => setForm((f) => ({ ...f, level: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Input value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} placeholder="English" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Duration *</Label>
              <Input required value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} placeholder="e.g. 8 hours" />
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input type="number" min="0" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max Students</Label>
              <Input type="number" min="1" value={form.maxStudents} onChange={(e) => setForm((f) => ({ ...f, maxStudents: e.target.value }))} placeholder="Unlimited" />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.certificate} onChange={(e) => setForm((f) => ({ ...f, certificate: e.target.checked }))} className="rounded" />
                <span className="text-sm font-medium">Issue Certificate</span>
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Schedule *</Label>
            <Input required value={form.schedule} onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))} placeholder="e.g. Saturdays 10am–12pm" />
          </div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea required rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Prerequisites</Label>
            <Textarea rows={2} value={form.prerequisites} onChange={(e) => setForm((f) => ({ ...f, prerequisites: e.target.value }))} placeholder="What attendees should know before joining" />
          </div>
        </div>

        {/* Tags */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Tags</h2>
          <div className="flex gap-2">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }} placeholder="Add a tag and press Enter" />
            <Button type="button" variant="outline" onClick={addTag}>Add</Button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map((t) => (
                <span key={t} className="flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                  {t}
                  <button type="button" onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Curriculum */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Curriculum</h2>
            <Button type="button" variant="outline" size="sm" onClick={addModule}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add Module
            </Button>
          </div>
          {modules.map((mod, i) => (
            <div key={i} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={mod.module}
                  onChange={(e) => setModules((ms) => ms.map((m, j) => j === i ? { ...m, module: e.target.value } : m))}
                  placeholder={`Module ${i + 1} title`}
                  className="flex-1"
                />
                <Input
                  type="number" min="0"
                  value={mod.durationMins}
                  onChange={(e) => setModules((ms) => ms.map((m, j) => j === i ? { ...m, durationMins: e.target.value } : m))}
                  placeholder="mins"
                  className="w-20"
                />
                <Button type="button" variant="ghost" size="icon" onClick={() => setModules((ms) => ms.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                {mod.topics.map((topic, k) => (
                  <div key={k} className="flex items-center gap-2">
                    <Input
                      value={topic}
                      onChange={(e) => setModules((ms) => ms.map((m, j) => j === i ? { ...m, topics: m.topics.map((t, l) => l === k ? e.target.value : t) } : m))}
                      placeholder={`Topic ${k + 1}`}
                      className="flex-1"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setModules((ms) => ms.map((m, j) => j === i ? { ...m, topics: m.topics.filter((_, l) => l !== k) } : m))}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button" variant="ghost" size="sm"
                  onClick={() => setModules((ms) => ms.map((m, j) => j === i ? { ...m, topics: [...m.topics, ""] } : m))}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />Add topic
                </Button>
              </div>
            </div>
          ))}
          {modules.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No curriculum added yet. Add modules to help students understand what they&apos;ll learn.</p>
          )}
        </div>

        {/* Images */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Cover Images</h2>
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
            <label className="h-20 w-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:bg-muted">
              <Upload className="h-5 w-5 text-muted-foreground" />
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="sr-only" />
            </label>
          </div>
        </div>

        {/* Status */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded" />
            <div>
              <p className="font-medium text-sm">Course is active</p>
              <p className="text-xs text-muted-foreground">Uncheck to pause enrollment without deleting</p>
            </div>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={`/learning/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
