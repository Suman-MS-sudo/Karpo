"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Loader2, Plus, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { CompanyAutocomplete } from "@/components/ui/company-autocomplete"
import { DEPARTMENTS } from "@/config/services"
import { cn } from "@/lib/utils"

const REQUIRED_FIELDS = [
  "title", "companyName", "department", "jobType", "workMode",
  "experienceMin", "experienceMax", "description", "consent",
] as const
type RequiredField = (typeof REQUIRED_FIELDS)[number]

const FIELD_LABELS: Record<RequiredField, string> = {
  title:         "Job Title",
  companyName:   "Company Name",
  department:    "Department",
  jobType:       "Job Type",
  workMode:      "Work Mode",
  experienceMin: "Min Experience",
  experienceMax: "Max Experience",
  description:   "Job Description",
  consent:       "the consent checkbox",
}

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

  const [companyName, setCompanyName] = useState("")
  const [companyId,   setCompanyId]   = useState<string | undefined>(undefined)

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
  const [consent, setConsent] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequiredField, boolean>>>({})

  const fieldRefs = useRef<Partial<Record<RequiredField, HTMLDivElement | null>>>({})

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }))
    if (key in fieldErrors) setFieldErrors((prev) => ({ ...prev, [key]: false }))
  }

  function validate(): RequiredField[] {
    const missing: RequiredField[] = []
    if (!form.title.trim())         missing.push("title")
    if (!companyName.trim())        missing.push("companyName")
    if (!form.department)           missing.push("department")
    if (!form.jobType)              missing.push("jobType")
    if (!form.workMode)             missing.push("workMode")
    if (!form.experienceMin.trim()) missing.push("experienceMin")
    if (!form.experienceMax.trim()) missing.push("experienceMax")
    if (!form.description.trim())  missing.push("description")
    if (!consent)                   missing.push("consent")
    return missing
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const missing = validate()
    if (missing.length > 0) {
      setFieldErrors(Object.fromEntries(missing.map((f) => [f, true])))
      const firstEl = fieldRefs.current[missing[0]]
      firstEl?.scrollIntoView({ behavior: "smooth", block: "center" })
      const focusable = firstEl?.querySelector<HTMLElement>("input, button, textarea")
      focusable?.focus()
      setError(`Please fill in ${FIELD_LABELS[missing[0]]}${missing.length > 1 ? ` (and ${missing.length - 1} other field${missing.length > 2 ? "s" : ""})` : ""}.`)
      return
    }

    setLoading(true); setError("")
    try {
      const res = await fetch("/api/referrals", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          skills,
          companyName,
          companyId,
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
            <div ref={(el) => { fieldRefs.current.title = el }} className="col-span-2 space-y-1.5">
              <Label>Job Title <span className="text-red-500">*</span></Label>
              <Input
                required
                placeholder="e.g. Senior Software Engineer"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                className={cn(fieldErrors.title && "border-red-500 focus-visible:ring-red-400")}
              />
              {fieldErrors.title && <p className="text-xs text-red-500">Job title is required.</p>}
            </div>
            <div ref={(el) => { fieldRefs.current.companyName = el }} className="col-span-2 space-y-1.5">
              <Label>Company Name <span className="text-red-500">*</span></Label>
              <CompanyAutocomplete
                required
                value={companyName}
                onChange={(name, id) => {
                  setCompanyName(name)
                  setCompanyId(id)
                  if (fieldErrors.companyName) setFieldErrors((prev) => ({ ...prev, companyName: false }))
                }}
                placeholder="e.g. Acme Corp"
                className={cn(fieldErrors.companyName && "[&>div]:border-red-500 [&>div]:ring-2 [&>div]:ring-red-200")}
              />
              {fieldErrors.companyName && <p className="text-xs text-red-500">Company name is required.</p>}
            </div>
            <div ref={(el) => { fieldRefs.current.department = el }} className="space-y-1.5">
              <Label>Department <span className="text-red-500">*</span></Label>
              <Select required value={form.department} onValueChange={(v) => set("department", v)}>
                <SelectTrigger className={cn(fieldErrors.department && "border-red-500 ring-2 ring-red-200")}><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.department && <p className="text-xs text-red-500">Please select a department.</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Office Location</Label>
              <CityAutocomplete value={form.location} onChange={(city) => set("location", city)} placeholder="e.g. Bengaluru…" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div ref={(el) => { fieldRefs.current.jobType = el }} className="space-y-1.5">
              <Label>Job Type <span className="text-red-500">*</span></Label>
              <Select required value={form.jobType} onValueChange={(v) => set("jobType", v)}>
                <SelectTrigger className={cn(fieldErrors.jobType && "border-red-500 ring-2 ring-red-200")}><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full-time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                  <SelectItem value="PART_TIME">Part-time</SelectItem>
                  <SelectItem value="INTERNSHIP">Internship</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.jobType && <p className="text-xs text-red-500">Please select a job type.</p>}
            </div>
            <div ref={(el) => { fieldRefs.current.workMode = el }} className="space-y-1.5">
              <Label>Work Mode <span className="text-red-500">*</span></Label>
              <Select required value={form.workMode} onValueChange={(v) => set("workMode", v)}>
                <SelectTrigger className={cn(fieldErrors.workMode && "border-red-500 ring-2 ring-red-200")}><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONSITE">On-site</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.workMode && <p className="text-xs text-red-500">Please select a work mode.</p>}
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
        </section>

        {/* ── Section 3: Requirements ──────────────────────────── */}
        <section className="space-y-5">
          <div className="flex items-center gap-3 pb-2 border-b border-border">
            <span className="h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
            <h2 className="font-semibold">Requirements</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div ref={(el) => { fieldRefs.current.experienceMin = el }} className="space-y-1.5">
              <Label>Min Experience (years) <span className="text-red-500">*</span></Label>
              <Input
                required type="number" min="0" max="30" placeholder="3"
                value={form.experienceMin}
                onChange={(e) => set("experienceMin", e.target.value)}
                className={cn(fieldErrors.experienceMin && "border-red-500 focus-visible:ring-red-400")}
              />
              {fieldErrors.experienceMin && <p className="text-xs text-red-500">Required.</p>}
            </div>
            <div ref={(el) => { fieldRefs.current.experienceMax = el }} className="space-y-1.5">
              <Label>Max Experience (years) <span className="text-red-500">*</span></Label>
              <Input
                required type="number" min="0" max="30" placeholder="8"
                value={form.experienceMax}
                onChange={(e) => set("experienceMax", e.target.value)}
                className={cn(fieldErrors.experienceMax && "border-red-500 focus-visible:ring-red-400")}
              />
              {fieldErrors.experienceMax && <p className="text-xs text-red-500">Required.</p>}
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

          <div ref={(el) => { fieldRefs.current.description = el }} className="space-y-1.5">
            <Label>Job Description <span className="text-red-500">*</span></Label>
            <Textarea
              required rows={7}
              placeholder={"Describe the role, key responsibilities, and what success looks like in this position…"}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className={cn(fieldErrors.description && "border-red-500 focus-visible:ring-red-400")}
            />
            {fieldErrors.description && <p className="text-xs text-red-500">Job description is required.</p>}
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

        <div ref={(el) => { fieldRefs.current.consent = el }} className={cn("space-y-1.5 rounded-lg", fieldErrors.consent && "ring-2 ring-red-300 p-2 -m-2")}>
          <label className="flex items-start gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              required
              className={cn("mt-0.5", fieldErrors.consent && "accent-red-500 outline outline-2 outline-red-400")}
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked)
                if (fieldErrors.consent) setFieldErrors((prev) => ({ ...prev, consent: false }))
              }}
            />
            I confirm this referral reflects a genuine opening at my official employer and consciously posting it
            here. Korpo is not involved in the hiring decision, terms, or outcome — it only facilitates the
            connection between colleagues.
          </label>
          {fieldErrors.consent && <p className="text-xs text-red-500">Please confirm you agree before posting.</p>}
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-3">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !consent}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Posting…</> : "Post Referral"}
        </Button>
      </form>
    </div>
  )
}
