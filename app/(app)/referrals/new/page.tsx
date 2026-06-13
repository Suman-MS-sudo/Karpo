"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

const PERK_OPTIONS = [
  "Health Insurance", "Dental & Vision", "Life Insurance",
  "Equity / ESOPs", "Performance Bonus", "Flexible Hours",
  "Work from Home", "WFH Stipend", "Learning Budget",
  "Gym / Wellness", "Paid Parental Leave", "Team Outings",
]

function SkillInput({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [input, setInput] = useState("")

  function add() {
    const v = input.trim()
    if (v && !skills.includes(v)) onChange([...skills, v])
    setInput("")
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add() } }}
          placeholder="e.g. React, Python, Kubernetes…"
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={!input.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2.5 py-1 rounded-full font-medium">
              {s}
              <button type="button" onClick={() => onChange(skills.filter((x) => x !== s))}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NewReferralPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const [form, setForm] = useState({
    title:           "",
    department:      "",
    jobType:         "",
    workMode:        "",
    location:        "",
    openings:        "1",
    experienceMin:   "",
    experienceMax:   "",
    salaryMin:       "",
    salaryMax:       "",
    referralBonus:   "",
    internalCode:    "",
    deadline:        "",
    interviewProcess: "",
    description:     "",
  })
  const [skills, setSkills] = useState<string[]>([])
  const [perks,  setPerks]  = useState<string[]>([])

  function set(key: string, val: string) { setForm((f) => ({ ...f, [key]: val })) }
  function togglePerk(p: string) { setPerks((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError("")
    try {
      const res = await fetch("/api/referrals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          skills,
          perks,
          experienceMin: parseInt(form.experienceMin),
          experienceMax: parseInt(form.experienceMax),
          openings:      parseInt(form.openings) || 1,
          salaryMin:     form.salaryMin     ? parseInt(form.salaryMin)     : undefined,
          salaryMax:     form.salaryMax     ? parseInt(form.salaryMax)     : undefined,
          referralBonus: form.referralBonus ? parseInt(form.referralBonus) : undefined,
          deadline:      form.deadline      ? new Date(form.deadline)      : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) router.push(`/referrals/${data.id}`)
      else setError(data.error ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/referrals" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Referrals
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Post a Referral</h1>
        <p className="text-muted-foreground text-sm mt-1">The more detail you provide, the higher-quality applicants you'll attract.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Section 1: Role basics ───────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <span className="h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
            <h2 className="font-semibold">Role Overview</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Job Title <span className="text-red-500">*</span></Label>
              <Input required placeholder="e.g. Senior Software Engineer" value={form.title} onChange={(e) => set("title", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Department <span className="text-red-500">*</span></Label>
              <Input required placeholder="e.g. Engineering, Product, Data Science" value={form.department} onChange={(e) => set("department", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Office Location</Label>
              <Input placeholder="e.g. Bengaluru, Hybrid (Delhi NCR)" value={form.location} onChange={(e) => set("location", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Job Type <span className="text-red-500">*</span></Label>
              <Select required value={form.jobType} onValueChange={(v) => set("jobType", v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full-time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="PART_TIME">Part-time</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Work Mode <span className="text-red-500">*</span></Label>
              <Select required value={form.workMode} onValueChange={(v) => set("workMode", v)}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONSITE">On-site</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>No. of Openings</Label>
              <Input type="number" min="1" max="50" value={form.openings} onChange={(e) => set("openings", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Internal Job Code / Req ID <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
            <Input placeholder="e.g. ENG-2024-042" value={form.internalCode} onChange={(e) => set("internalCode", e.target.value)} />
          </div>
        </section>

        {/* ── Section 2: Compensation ──────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <span className="h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <h2 className="font-semibold">Compensation</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Min Salary (LPA) <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
              <Input type="number" min="0" placeholder="12" value={form.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Salary (LPA) <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
              <Input type="number" min="0" placeholder="24" value={form.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Referral Bonus (₹) <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
              <Input type="number" placeholder="25000" value={form.referralBonus} onChange={(e) => set("referralBonus", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Application Deadline <span className="text-muted-foreground font-normal text-xs">optional</span></Label>
              <Input type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Perks & Benefits</Label>
            <div className="flex flex-wrap gap-2">
              {PERK_OPTIONS.map((p) => (
                <button
                  key={p} type="button"
                  onClick={() => togglePerk(p)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                    perks.includes(p)
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300"
                      : "border-border text-muted-foreground hover:border-border/70"
                  )}>
                  {perks.includes(p) && "✓ "}{p}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 3: Requirements ──────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <span className="h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <h2 className="font-semibold">Requirements</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Min Experience (years) <span className="text-red-500">*</span></Label>
              <Input required type="number" min="0" max="30" placeholder="3" value={form.experienceMin} onChange={(e) => set("experienceMin", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Max Experience (years) <span className="text-red-500">*</span></Label>
              <Input required type="number" min="0" max="30" placeholder="8" value={form.experienceMax} onChange={(e) => set("experienceMax", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Required Skills / Tech Stack</Label>
            <SkillInput skills={skills} onChange={setSkills} />
            <p className="text-xs text-muted-foreground">Press Enter or click + to add each skill</p>
          </div>
        </section>

        {/* ── Section 4: Role details ──────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <span className="h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">4</span>
            <h2 className="font-semibold">Role Details</h2>
          </div>

          <div className="space-y-1.5">
            <Label>Job Description <span className="text-red-500">*</span></Label>
            <Textarea
              required rows={7}
              placeholder={"Describe the role, key responsibilities, and what success looks like in this position…"}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Interview Process <span className="text-muted-foreground font-normal text-xs">optional — helps candidates prepare</span></Label>
            <Textarea
              rows={4}
              placeholder={"e.g.\nRound 1: Online assessment (45 min)\nRound 2: Technical interview with hiring manager\nRound 3: System design\nRound 4: HR / culture fit"}
              value={form.interviewProcess}
              onChange={(e) => set("interviewProcess", e.target.value)}
            />
          </div>
        </section>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Posting…</> : "Post Referral"}
        </Button>
      </form>
    </div>
  )
}
