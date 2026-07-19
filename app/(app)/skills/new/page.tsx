"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, X, Loader2, Lightbulb } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const CATEGORIES = ["TECH","DATA","DESIGN","ENGINEERING","MARKETING","BUSINESS","FINANCE","LEGAL","LANGUAGE","COACHING","CREATIVE","WELLNESS","MUSIC","PHOTOGRAPHY"]
const DAYS = ["MON","TUE","WED","THU","FRI","SAT","SUN"]
const SLOTS = ["08:00–09:00","09:00–10:00","10:00–11:00","11:00–12:00","12:00–13:00","13:00–14:00","14:00–15:00","15:00–16:00","16:00–17:00","17:00–18:00","18:00–19:00","19:00–20:00","20:00–21:00"]

function TagInput({ label, tags, onAdd, onRemove, placeholder }: { label: string; tags: string[]; onAdd: (t: string) => void; onRemove: (t: string) => void; placeholder: string }) {
  const [val, setVal] = useState("")
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (val.trim()) { onAdd(val.trim()); setVal("") } } }} />
        <Button type="button" variant="outline" size="sm" onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal("") } }}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 text-xs px-2.5 py-1 bg-muted rounded-full border border-border">
              {t}<button type="button" onClick={() => onRemove(t)}><X className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={cn("flex items-start gap-3 px-4 py-3 rounded-xl border text-left w-full transition-all", checked ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30" : "border-border hover:border-muted-foreground/40")}>
      <span className={cn("h-5 w-5 rounded border flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold", checked ? "bg-primary-600 border-primary-600 text-white" : "border-input bg-background")}>{checked && "✓"}</span>
      <div><p className={cn("text-sm font-medium", checked ? "text-primary-700 dark:text-primary-300" : "")}>{label}</p>{desc && <p className="text-xs text-muted-foreground">{desc}</p>}</div>
    </button>
  )
}

interface Pkg { name: string; price: string; durationHrs: string; description: string; features: string[] }
interface FAQ { q: string; a: string }

const STEP_LABELS = ["About You", "Your Offering", "Packages & Pricing", "Availability & Settings"]

export default function NewSkillPage() {
  const router = useRouter()
  const [step, setStep]     = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState("")

  // Step 0 — About
  const [category,      setCategory]      = useState("")
  const [subcategory,   setSubcategory]   = useState("")
  const [yearsExp,      setYearsExp]      = useState("")
  const [certifications, setCertifications] = useState<string[]>([])
  const [portfolioUrl,  setPortfolioUrl]  = useState("")
  const [linkedIn,      setLinkedIn]      = useState("")

  // Step 1 — Offering
  const [title,         setTitle]         = useState("")
  const [tagline,       setTagline]       = useState("")
  const [description,   setDescription]   = useState("")
  const [skills,        setSkills]        = useState<string[]>([])
  const [deliverables,  setDeliverables]  = useState<string[]>([])
  const [requirements,  setRequirements]  = useState("")
  const [format,        setFormat]        = useState("ONLINE")
  const [location,      setLocation]      = useState("")
  const [faqs,          setFaqs]          = useState<FAQ[]>([{ q: "", a: "" }])

  // Step 2 — Packages
  const [pricingModel, setPricingModel] = useState("PACKAGE")
  const [hourlyRate,   setHourlyRate]   = useState("")
  const [packages, setPackages] = useState<Pkg[]>([
    { name: "Basic",    price: "", durationHrs: "1",  description: "", features: [""] },
    { name: "Standard", price: "", durationHrs: "3",  description: "", features: ["",""] },
    { name: "Premium",  price: "", durationHrs: "8",  description: "", features: ["","",""] },
  ])

  // Step 3 — Availability
  const [availDays,   setAvailDays]   = useState<string[]>(["MON","TUE","WED","THU","FRI"])
  const [availSlots,  setAvailSlots]  = useState<string[]>(["10:00–11:00","14:00–15:00"])
  const [bufferMins,  setBufferMins]  = useState("30")
  const [maxClients,  setMaxClients]  = useState("")

  function toggleDay(d: string)  { setAvailDays((p)  => p.includes(d) ? p.filter((x) => x !== d) : [...p, d]) }
  function toggleSlot(s: string) { setAvailSlots((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]) }

  function updatePkg(i: number, key: keyof Pkg, value: string) {
    setPackages((prev) => { const n = [...prev]; (n[i] as any)[key] = value; return n })
  }
  function updatePkgFeature(pi: number, fi: number, v: string) {
    setPackages((prev) => { const n = [...prev]; n[pi].features[fi] = v; return n })
  }
  function addPkgFeature(pi: number) {
    setPackages((prev) => { const n = [...prev]; n[pi].features.push(""); return n })
  }
  function updateFaq(i: number, key: "q" | "a", v: string) {
    setFaqs((prev) => { const n = [...prev]; n[i][key] = v; return n })
  }

  const canNext = [
    category.length > 0 && subcategory.trim().length > 0,
    title.length > 3 && description.length > 20,
    pricingModel === "HOURLY" ? !!hourlyRate : packages.some((p) => !!p.price),
    availDays.length > 0,
  ]

  async function submit() {
    setLoading(true); setError("")
    try {
      const payload = {
        category, subcategory,
        yearsExp: yearsExp || undefined, certifications, portfolioUrl: portfolioUrl || undefined, linkedIn: linkedIn || undefined,
        title, tagline: tagline || undefined, description, skills, deliverables, requirements: requirements || undefined,
        format, location: location || undefined,
        faqs: faqs.filter((f) => f.q && f.a),
        pricingModel,
        hourlyRate:   pricingModel === "HOURLY" ? Number(hourlyRate) : undefined,
        packages:     pricingModel === "PACKAGE" ? packages.filter((p) => p.price).map((p) => ({
          name:        p.name,
          price:       Number(p.price),
          durationHrs: Number(p.durationHrs),
          description: p.description,
          features:    p.features.filter(Boolean),
        })) : undefined,
        availability: { days: availDays, slots: availSlots, bufferMins: Number(bufferMins) },
        maxClientsPerMonth: maxClients ? Number(maxClients) : undefined,
      }
      const res = await fetch("/api/skills", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (res.ok) router.push(`/skills/${data.id}`)
      else setError(data.error ?? "Something went wrong")
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/skills" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to Skills
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">List Your Skill</h1>
        <p className="text-muted-foreground text-sm mt-1">Share your expertise with your colleagues and earn.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-2 mb-8">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border-2 transition-all",
              i < step ? "border-emerald-500 bg-emerald-500 text-white" :
              i === step ? "border-primary-500 bg-primary-500 text-white" :
              "border-border bg-background text-muted-foreground")}>
              {i < step ? "✓" : i + 1}
            </div>
            <span className={cn("text-xs font-medium hidden sm:block", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            {i < STEP_LABELS.length - 1 && <div className={cn("h-px flex-1 mx-1", i < step ? "bg-emerald-500" : "bg-border")} />}
          </div>
        ))}
      </div>

      <div className="space-y-6">

        {/* ── Step 0: About You ───────────────────────── */}
        {step === 0 && (
          <section className="space-y-5">
            <div className="space-y-1.5">
              <Label>Category <span className="text-red-500">*</span></Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    className={cn("text-xs px-3 py-1.5 rounded-full border font-medium transition-all", category === c ? "border-primary-500 bg-primary-500 text-white" : "border-border text-muted-foreground hover:border-muted-foreground/50")}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subcategory <span className="text-red-500">*</span></Label>
              <Input value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="e.g. React, Python, Tax Law, Yoga" />
            </div>
            <div className="space-y-1.5">
              <Label>Years of experience</Label>
              <Input type="number" min="0" max="40" value={yearsExp} onChange={(e) => setYearsExp(e.target.value)} placeholder="5" className="w-32" />
            </div>
            <TagInput label="Certifications" tags={certifications} onAdd={(t) => setCertifications((p) => [...p, t])} onRemove={(t) => setCertifications((p) => p.filter((x) => x !== t))} placeholder="e.g. AWS Certified, CFA, IELTS Trainer" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>Portfolio URL</Label><Input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} placeholder="https://portfolio.com" /></div>
              <div className="space-y-1.5"><Label>LinkedIn</Label><Input value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/…" /></div>
            </div>
          </section>
        )}

        {/* ── Step 1: Your Offering ───────────────────── */}
        {step === 1 && (
          <section className="space-y-5">
            <div className="space-y-1.5">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Python for Data Science — 1:1 Mentoring" maxLength={100} />
              <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
            </div>
            <div className="space-y-1.5">
              <Label>Tagline</Label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="One punchy line about what you offer" maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label>Description <span className="text-red-500">*</span></Label>
              <Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain your expertise, approach, and what the client can expect. The more detail the better." />
            </div>
            <TagInput label="Skills / Topics" tags={skills} onAdd={(t) => setSkills((p) => [...p, t])} onRemove={(t) => setSkills((p) => p.filter((x) => x !== t))} placeholder="e.g. Python, Machine Learning, pandas" />
            <TagInput label="What you'll deliver" tags={deliverables} onAdd={(t) => setDeliverables((p) => [...p, t])} onRemove={(t) => setDeliverables((p) => p.filter((x) => x !== t))} placeholder="e.g. Session recording, homework exercises, notes" />
            <div className="space-y-1.5">
              <Label>What client should bring / prerequisites</Label>
              <Textarea rows={2} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="e.g. Basic Python knowledge, laptop with Jupyter installed" />
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <div className="flex gap-3">
                {["ONLINE","IN_PERSON","BOTH"].map((f) => (
                  <button key={f} type="button" onClick={() => setFormat(f)}
                    className={cn("flex-1 text-sm py-2.5 rounded-xl border font-medium transition-all", format === f ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300" : "border-border text-muted-foreground")}>
                    {f.replace("_"," ")}
                  </button>
                ))}
              </div>
              {format !== "ONLINE" && <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City / area for in-person sessions" />}
            </div>

            {/* FAQs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>FAQs <span className="text-muted-foreground text-xs font-normal">optional</span></Label>
                <button type="button" onClick={() => setFaqs((p) => [...p, { q: "", a: "" }])} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Plus className="h-3 w-3" />Add FAQ</button>
              </div>
              {faqs.map((faq, i) => (
                <div key={i} className="bg-muted/30 rounded-xl p-4 space-y-2 border border-border">
                  <Input value={faq.q} onChange={(e) => updateFaq(i, "q", e.target.value)} placeholder="Question" className="text-sm" />
                  <Textarea rows={2} value={faq.a} onChange={(e) => updateFaq(i, "a", e.target.value)} placeholder="Answer" className="resize-none text-sm" />
                  {faqs.length > 1 && <button type="button" onClick={() => setFaqs((p) => p.filter((_, j) => j !== i))} className="text-xs text-red-500 hover:underline">Remove</button>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Step 2: Packages & Pricing ─────────────── */}
        {step === 2 && (
          <section className="space-y-5">
            <div className="space-y-2">
              <Label>Pricing model</Label>
              <div className="grid grid-cols-2 gap-3">
                {[["PACKAGE","Tiered packages (Basic / Standard / Premium)"],["HOURLY","Hourly rate"]].map(([v,l]) => (
                  <button key={v} type="button" onClick={() => setPricingModel(v)}
                    className={cn("text-sm py-3 px-4 rounded-xl border text-left font-medium transition-all", pricingModel === v ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300" : "border-border text-muted-foreground")}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {pricingModel === "HOURLY" ? (
              <div className="space-y-1.5">
                <Label>Hourly rate (₹) <span className="text-red-500">*</span></Label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">₹</span>
                  <Input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="500" className="w-40" />
                  <span className="text-muted-foreground text-sm">/ hour</span>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {packages.map((pkg, pi) => (
                  <div key={pi} className="border border-border rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm">{pkg.name} Package</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">₹</span>
                        <Input type="number" min="0" value={pkg.price} onChange={(e) => updatePkg(pi, "price", e.target.value)} placeholder="Price" className="w-28 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label className="text-xs">Duration (hours)</Label><Input type="number" min="0.5" step="0.5" value={pkg.durationHrs} onChange={(e) => updatePkg(pi, "durationHrs", e.target.value)} className="text-sm" /></div>
                      <div className="space-y-1"><Label className="text-xs">Short description</Label><Input value={pkg.description} onChange={(e) => updatePkg(pi, "description", e.target.value)} placeholder="What's included" className="text-sm" /></div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Features / inclusions</Label>
                      {pkg.features.map((f, fi) => (
                        <Input key={fi} value={f} onChange={(e) => updatePkgFeature(pi, fi, e.target.value)} placeholder={`Feature ${fi + 1}…`} className="text-sm" />
                      ))}
                      <button type="button" onClick={() => addPkgFeature(pi)} className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"><Plus className="h-3 w-3" />Add feature</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pricing tip */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
              <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300">Set competitive but fair prices. You can update them any time. Colleagues tend to pay ₹300–₹2000/hr for professional skills.</p>
            </div>
          </section>
        )}

        {/* ── Step 3: Availability ────────────────────── */}
        {step === 3 && (
          <section className="space-y-5">
            <div className="space-y-2">
              <Label>Available days</Label>
              <div className="flex gap-2 flex-wrap">
                {DAYS.map((d) => (
                  <button key={d} type="button" onClick={() => toggleDay(d)}
                    className={cn("text-xs px-3 py-1.5 rounded-lg border font-medium transition-all", availDays.includes(d) ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300" : "border-border text-muted-foreground")}>
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Available time slots</Label>
              <div className="grid grid-cols-3 gap-2">
                {SLOTS.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSlot(s)}
                    className={cn("text-xs py-1.5 rounded-lg border font-medium transition-all", availSlots.includes(s) ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300" : "border-border text-muted-foreground")}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Buffer between sessions (min)</Label>
                <Select value={bufferMins} onValueChange={setBufferMins}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["0","15","30","45","60"].map((v) => <SelectItem key={v} value={v}>{v} min</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Max clients per month</Label>
                <Input type="number" min="1" value={maxClients} onChange={(e) => setMaxClients(e.target.value)} placeholder="Unlimited" />
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{error}</p>}
          </section>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep((s) => s - 1)}>← Back</Button>
          )}
          {step < 3 ? (
            <Button type="button" className="flex-1" disabled={!canNext[step]} onClick={() => setStep((s) => s + 1)}>
              Continue →
            </Button>
          ) : (
            <Button type="button" className="flex-1" disabled={loading} onClick={submit}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Publishing…</> : "Publish Listing"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
