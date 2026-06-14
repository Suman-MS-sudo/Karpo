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

interface Module { title: string; topics: string; durationMins: string }

export default function NewCoursePage() {
  const router  = useRouter()
  const [loading, setLoading]   = useState(false)
  const [images,  setImages]    = useState<string[]>([])
  const [tags,    setTags]      = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [modules, setModules]   = useState<Module[]>([])
  const [form, setForm] = useState({
    title: "", description: "", category: "", price: "0",
    duration: "", mode: "", schedule: "",
    level: "BEGINNER", language: "English",
    prerequisites: "", maxStudents: "",
    certificate: false,
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

  const addModule = () =>
    setModules((p) => [...p, { title: "", topics: "", durationMins: "" }])

  const updateModule = (i: number, k: keyof Module, v: string) =>
    setModules((p) => p.map((m, j) => j === i ? { ...m, [k]: v } : m))

  const removeModule = (i: number) =>
    setModules((p) => p.filter((_, j) => j !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const curriculum = modules
        .filter((m) => m.title)
        .map((m) => ({
          module:       m.title,
          topics:       m.topics.split("\n").map((t) => t.trim()).filter(Boolean),
          durationMins: parseInt(m.durationMins) || 0,
        }))

      const res = await fetch("/api/learning", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price:       parseInt(form.price) || 0,
          maxStudents: form.maxStudents ? parseInt(form.maxStudents) : undefined,
          images,
          tags,
          curriculum:  curriculum.length > 0 ? curriculum : undefined,
        }),
      })
      const d = await res.json()
      if (res.ok) router.push(`/learning/${d.id}`)
      else alert(d.error ?? "Failed to create course")
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/learning" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Learning Hub
      </Link>
      <h1 className="text-2xl font-bold mb-2">List a Course or Workshop</h1>
      <p className="text-muted-foreground text-sm mb-6">Fill in the details — you can edit and add curriculum after publishing.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Course Details</h2>
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input required placeholder="e.g. Advanced Python for Data Engineers" value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Input required placeholder="e.g. Programming, Finance" value={form.category} onChange={(e) => set("category", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Mode *</Label>
              <Select required value={form.mode} onValueChange={(v) => set("mode", v)}>
                <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">🌐 Online</SelectItem>
                  <SelectItem value="OFFLINE">📍 Offline</SelectItem>
                  <SelectItem value="HYBRID">🔀 Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Duration *</Label>
              <Input required placeholder="e.g. 8 hours / 4 weeks" value={form.duration} onChange={(e) => set("duration", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Price (₹)</Label>
              <Input type="number" min="0" placeholder="0 for free" value={form.price} onChange={(e) => set("price", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Schedule *</Label>
            <Input required placeholder="e.g. Saturdays 10am–12pm, starting Jan 15" value={form.schedule} onChange={(e) => set("schedule", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea required rows={4} placeholder="What will participants learn? What's unique about this course?" value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
        </div>

        {/* Level & Audience */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Level & Audience</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => set("level", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">🟢 Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">🟡 Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">🔴 Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Language</Label>
              <Input placeholder="English" value={form.language} onChange={(e) => set("language", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max Students</Label>
              <Input type="number" min="1" placeholder="Unlimited" value={form.maxStudents} onChange={(e) => set("maxStudents", e.target.value)} />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <div className="flex items-center gap-3 h-10">
                <input
                  type="checkbox"
                  id="certificate"
                  checked={form.certificate}
                  onChange={(e) => set("certificate", e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <Label htmlFor="certificate" className="cursor-pointer">Issues certificate</Label>
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Prerequisites</Label>
            <Textarea rows={2} placeholder="What should participants already know? e.g. Basic Python, familiarity with Excel" value={form.prerequisites} onChange={(e) => set("prerequisites", e.target.value)} />
          </div>
        </div>

        {/* Tags */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Tags</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag (e.g. Python, Excel, Finance)"
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
                  <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))} className="ml-0.5 text-muted-foreground hover:text-red-500">
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
            <div>
              <h2 className="font-semibold">Curriculum (optional)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Add modules to show what you'll cover</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addModule}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add Module
            </Button>
          </div>

          {modules.length === 0 ? (
            <p className="text-sm text-muted-foreground">No modules yet. Add curriculum modules to help students know what to expect.</p>
          ) : (
            <div className="space-y-4">
              {modules.map((mod, i) => (
                <div key={i} className="bg-muted/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Module {i + 1}</p>
                    <button type="button" onClick={() => removeModule(i)} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-muted-foreground hover:text-red-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-[1fr_80px] gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Module Title *</Label>
                      <Input required placeholder="e.g. Introduction to Python" value={mod.title} onChange={(e) => updateModule(i, "title", e.target.value)} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Duration (min)</Label>
                      <Input type="number" min="0" placeholder="60" value={mod.durationMins} onChange={(e) => updateModule(i, "durationMins", e.target.value)} className="h-9 text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Topics (one per line)</Label>
                    <Textarea
                      rows={3}
                      placeholder={"Variables & data types\nControl flow\nFunctions"}
                      value={mod.topics}
                      onChange={(e) => updateModule(i, "topics", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cover Image */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Cover Image</h2>
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
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Listing…</> : "List Course"}
        </Button>
      </form>
    </div>
  )
}
