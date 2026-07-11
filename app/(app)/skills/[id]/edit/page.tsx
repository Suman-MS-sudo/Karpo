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

const CATEGORIES = ["TECH","DATA","DESIGN","ENGINEERING","MARKETING","BUSINESS","FINANCE","LEGAL","LANGUAGE","COACHING","CREATIVE","WELLNESS"]
const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"]

type Pkg = { name: string; price: string; durationHrs: string; description: string; features: string }
type FAQ = { q: string; a: string }

export default function EditSkillPage() {
  const router  = useRouter()
  const params  = useParams()
  const id      = params.id as string

  const [loading,   setLoading]   = useState(false)
  const [fetching,  setFetching]  = useState(true)
  const [skillInput, setSkillInput] = useState("")
  const [certInput,  setCertInput]  = useState("")
  const [packages,  setPackages]  = useState<Pkg[]>([])
  const [faqs,      setFaqs]      = useState<FAQ[]>([])
  const [avail, setAvail] = useState({ days: [] as string[], slots: [] as string[], bufferMins: "15" })
  const [form, setForm] = useState({
    title: "", tagline: "", category: "TECH", subcategory: "",
    description: "", requirements: "", skills: [] as string[],
    deliverables: [] as string[], pricingModel: "PACKAGE",
    hourlyRate: "", format: "ONLINE", location: "", timezone: "Asia/Kolkata",
    maxClientsPerMonth: "", yearsExp: "", certifications: [] as string[],
    portfolioUrl: "", linkedIn: "", status: "ACTIVE",
  })

  useEffect(() => {
    fetch(`/api/skills/${id}`)
      .then((r) => r.json())
      .then(({ listing: l }) => {
        if (!l) return
        setForm({
          title: l.title ?? "", tagline: l.tagline ?? "", category: l.category ?? "TECH",
          subcategory: l.subcategory ?? "", description: l.description ?? "",
          requirements: l.requirements ?? "", skills: l.skills ?? [],
          deliverables: l.deliverables ?? [], pricingModel: l.pricingModel ?? "PACKAGE",
          hourlyRate: l.hourlyRate ? String(l.hourlyRate) : "", format: l.format ?? "ONLINE",
          location: l.location ?? "", timezone: l.timezone ?? "Asia/Kolkata",
          maxClientsPerMonth: l.maxClientsPerMonth ? String(l.maxClientsPerMonth) : "",
          yearsExp: l.yearsExp ? String(l.yearsExp) : "", certifications: l.certifications ?? [],
          portfolioUrl: l.portfolioUrl ?? "", linkedIn: l.linkedIn ?? "", status: l.status ?? "ACTIVE",
        })
        setPackages((l.packages ?? []).map((p: any) => ({
          name: p.name ?? "", price: String(p.price ?? 0), durationHrs: String(p.durationHrs ?? 1),
          description: p.description ?? "", features: (p.features ?? []).join("\n"),
        })))
        setFaqs((l.faqs ?? []).map((f: any) => ({ q: f.q ?? "", a: f.a ?? "" })))
        setAvail({
          days: l.availability?.days ?? [],
          slots: l.availability?.slots ?? [],
          bufferMins: String(l.availability?.bufferMins ?? 15),
        })
        setFetching(false)
      })
      .catch(() => setFetching(false))
  }, [id])

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !form.skills.includes(s)) setForm((f) => ({ ...f, skills: [...f.skills, s] }))
    setSkillInput("")
  }
  const addCert = () => {
    const c = certInput.trim()
    if (c && !form.certifications.includes(c)) setForm((f) => ({ ...f, certifications: [...f.certifications, c] }))
    setCertInput("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const body = {
        ...form,
        hourlyRate: form.hourlyRate ? parseInt(form.hourlyRate) : undefined,
        maxClientsPerMonth: form.maxClientsPerMonth ? parseInt(form.maxClientsPerMonth) : undefined,
        yearsExp: form.yearsExp ? parseInt(form.yearsExp) : undefined,
        packages: packages.filter((p) => p.name).map((p) => ({
          name: p.name, price: parseInt(p.price), durationHrs: parseInt(p.durationHrs),
          description: p.description, features: p.features.split("\n").filter(Boolean),
        })),
        faqs: faqs.filter((f) => f.q && f.a),
        availability: { days: avail.days, slots: avail.slots, bufferMins: parseInt(avail.bufferMins) },
      }
      const res = await fetch(`/api/skills/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      })
      const d = await res.json()
      if (res.ok) router.push(`/skills/${id}`)
      else alert(d.error)
    } finally { setLoading(false) }
  }

  const toggleDay = (day: string) => {
    setAvail((a) => ({ ...a, days: a.days.includes(day) ? a.days.filter((d) => d !== day) : [...a.days, day] }))
  }

  if (fetching) return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-muted-foreground">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/skills/${id}`} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to listing
      </Link>
      <h1 className="text-2xl font-bold mb-6">Edit Skill Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">About your offering</h2>
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Tagline</Label>
            <Input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} placeholder="One-liner that captures your value" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Subcategory</Label>
              <Input value={form.subcategory} onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))} placeholder="e.g. React, Financial Modelling" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description *</Label>
            <Textarea required rows={5} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Requirements / What you need from the client</Label>
            <Textarea rows={3} value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} />
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills & Tools</Label>
            <div className="flex gap-2">
              <Input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSkill() } }} placeholder="Add skill, press Enter" />
              <Button type="button" variant="outline" onClick={addSkill}>Add</Button>
            </div>
            {form.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.skills.map((s) => (
                  <span key={s} className="flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                    {s}<button type="button" onClick={() => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Deliverables */}
          <div className="space-y-2">
            <Label>Deliverables</Label>
            {form.deliverables.map((d, i) => (
              <div key={i} className="flex gap-2">
                <Input value={d} onChange={(e) => setForm((f) => ({ ...f, deliverables: f.deliverables.map((x, j) => j === i ? e.target.value : x) }))} placeholder={`Deliverable ${i + 1}`} />
                <Button type="button" variant="ghost" size="icon" onClick={() => setForm((f) => ({ ...f, deliverables: f.deliverables.filter((_, j) => j !== i) }))}><X className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, deliverables: [...f.deliverables, ""] }))}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add deliverable
            </Button>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Pricing</h2>
          <div className="space-y-1.5">
            <Label>Pricing Model</Label>
            <Select value={form.pricingModel} onValueChange={(v) => setForm((f) => ({ ...f, pricingModel: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="PACKAGE">Packages</SelectItem>
                <SelectItem value="HOURLY">Hourly rate</SelectItem>
                <SelectItem value="FIXED">Fixed price</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.pricingModel === "HOURLY" && (
            <div className="space-y-1.5">
              <Label>Hourly Rate (₹)</Label>
              <Input type="number" min="0" value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))} />
            </div>
          )}
          {form.pricingModel === "PACKAGE" && (
            <div className="space-y-3">
              {packages.map((pkg, i) => (
                <div key={i} className="border border-border rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input value={pkg.name} onChange={(e) => setPackages((ps) => ps.map((p, j) => j === i ? { ...p, name: e.target.value } : p))} placeholder="Package name" className="flex-1" />
                    <Input type="number" value={pkg.price} onChange={(e) => setPackages((ps) => ps.map((p, j) => j === i ? { ...p, price: e.target.value } : p))} placeholder="₹" className="w-24" />
                    <Input type="number" value={pkg.durationHrs} onChange={(e) => setPackages((ps) => ps.map((p, j) => j === i ? { ...p, durationHrs: e.target.value } : p))} placeholder="hrs" className="w-16" />
                    <Button type="button" variant="ghost" size="icon" onClick={() => setPackages((ps) => ps.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                  <Input value={pkg.description} onChange={(e) => setPackages((ps) => ps.map((p, j) => j === i ? { ...p, description: e.target.value } : p))} placeholder="Package description" />
                  <Textarea value={pkg.features} onChange={(e) => setPackages((ps) => ps.map((p, j) => j === i ? { ...p, features: e.target.value } : p))} placeholder="Features (one per line)" rows={3} />
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setPackages((ps) => [...ps, { name: "", price: "0", durationHrs: "1", description: "", features: "" }])}>
                <Plus className="h-3.5 w-3.5 mr-1" />Add package
              </Button>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Max clients / month</Label>
              <Input type="number" min="1" value={form.maxClientsPerMonth} onChange={(e) => setForm((f) => ({ ...f, maxClientsPerMonth: e.target.value }))} placeholder="No limit" />
            </div>
          </div>
        </div>

        {/* Format & Availability */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Format & Availability</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Format</Label>
              <Select value={form.format} onValueChange={(v) => setForm((f) => ({ ...f, format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="IN_PERSON">In-person</SelectItem>
                  <SelectItem value="BOTH">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(form.format === "IN_PERSON" || form.format === "BOTH") && (
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="City or area" />
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Available days</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((d) => (
                <button key={d} type="button"
                  onClick={() => toggleDay(d)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    avail.days.includes(d) ? "bg-primary-600 border-primary-600 text-white" : "border-border text-muted-foreground hover:border-primary-400"
                  }`}
                >{d}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Buffer between sessions (mins)</Label>
              <Input type="number" min="0" value={avail.bufferMins} onChange={(e) => setAvail((a) => ({ ...a, bufferMins: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold">Your Credentials</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Years of experience</Label>
              <Input type="number" min="0" value={form.yearsExp} onChange={(e) => setForm((f) => ({ ...f, yearsExp: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Certifications</Label>
            <div className="flex gap-2">
              <Input value={certInput} onChange={(e) => setCertInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCert() } }} placeholder="Add certification" />
              <Button type="button" variant="outline" onClick={addCert}>Add</Button>
            </div>
            {form.certifications.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.certifications.map((c) => (
                  <span key={c} className="flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-full">
                    {c}<button type="button" onClick={() => setForm((f) => ({ ...f, certifications: f.certifications.filter((x) => x !== c) }))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Portfolio URL</Label>
              <Input type="url" value={form.portfolioUrl} onChange={(e) => setForm((f) => ({ ...f, portfolioUrl: e.target.value }))} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>LinkedIn</Label>
              <Input type="url" value={form.linkedIn} onChange={(e) => setForm((f) => ({ ...f, linkedIn: e.target.value }))} placeholder="https://linkedin.com/in/..." />
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">FAQs</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setFaqs((f) => [...f, { q: "", a: "" }])}>
              <Plus className="h-3.5 w-3.5 mr-1" />Add FAQ
            </Button>
          </div>
          {faqs.map((faq, i) => (
            <div key={i} className="border border-border rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <Input value={faq.q} onChange={(e) => setFaqs((fs) => fs.map((f, j) => j === i ? { ...f, q: e.target.value } : f))} placeholder="Question" className="flex-1" />
                <Button type="button" variant="ghost" size="icon" onClick={() => setFaqs((fs) => fs.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
              <Textarea value={faq.a} onChange={(e) => setFaqs((fs) => fs.map((f, j) => j === i ? { ...f, a: e.target.value } : f))} placeholder="Answer" rows={2} />
            </div>
          ))}
          {faqs.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">No FAQs yet.</p>}
        </div>

        {/* Status */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Listing Status</h2>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Active — visible to everyone</SelectItem>
              <SelectItem value="PAUSED">Paused — hidden, no new orders</SelectItem>
              <SelectItem value="ARCHIVED">Archived — permanently hidden</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</> : "Save Changes"}
          </Button>
          <Button type="button" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30" asChild>
            <Link href={`/skills/${id}`}>Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
