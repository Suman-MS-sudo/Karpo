"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Camera, Loader2, CheckCircle2, Plus, X, ExternalLink, AtSign,
  User, Link as LinkIcon, Sparkles, AlertCircle, Building2,
} from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"
import { getInitials, cn } from "@/lib/utils"
import { PROFILE_SOCIAL_PLATFORMS } from "@/lib/socialPlatforms"

// ── Types ─────────────────────────────────────────────────────────────────

type SocialLinks = Record<string, string>

type ProfileForm = {
  name:       string
  bio:        string
  city:       string
  jobTitle:   string
  department: string
  phone:      string
  username:   string
  yearsOfExp: string
  skills:     string[]
  socialLinks: SocialLinks
}

const EMPTY_FORM: ProfileForm = {
  name: "", bio: "", city: "", jobTitle: "", department: "",
  phone: "", username: "", yearsOfExp: "", skills: [], socialLinks: {},
}

const TABS = [
  { id: "basic",  label: "Basic Info",         icon: User     },
  { id: "social", label: "Social Links",        icon: LinkIcon },
  { id: "skills", label: "Skills & Experience", icon: Sparkles },
]

// ── Completion calculator ──────────────────────────────────────────────────

function calcCompletion(form: ProfileForm, hasAvatar: boolean): number {
  const checks = [
    !!form.name,
    !!form.bio && form.bio.length > 20,
    !!form.city,
    !!form.jobTitle,
    !!form.department,
    !!form.phone,
    hasAvatar,
    form.skills.length > 0,
    !!form.yearsOfExp,
    Object.values(form.socialLinks).some(Boolean),
  ]
  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function EditProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading,    setLoading]    = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState("")
  const [activeTab,  setActiveTab]  = useState("basic")
  const [avatarUrl,  setAvatarUrl]  = useState("")
  const [skillInput, setSkillInput] = useState("")
  const [form,       setForm]       = useState<ProfileForm>(EMPTY_FORM)
  const [company,    setCompany]    = useState<{ name: string; logo?: string | null } | null>(null)

  // Load profile
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (!d) return
        setAvatarUrl(d.avatarUrl || d.image || "")
        if (d.company) setCompany(d.company)
        setForm({
          name:        d.name        ?? "",
          bio:         d.bio         ?? "",
          city:        d.city        ?? "",
          jobTitle:    d.jobTitle    ?? "",
          department:  d.department  ?? "",
          phone:       d.phone       ?? "",
          username:    d.username    ?? "",
          yearsOfExp:  d.yearsOfExp  != null ? String(d.yearsOfExp) : "",
          skills:      Array.isArray(d.skills) ? d.skills : [],
          socialLinks: (d.socialLinks as SocialLinks) ?? {},
        })
      })
  }, [])

  // Avatar upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    const res  = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (data.url) {
      setAvatarUrl(data.url)
      const patchRes = await fetch("/api/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ avatarUrl: data.url }),
      })
      if (!patchRes.ok) {
        toast.error("Photo uploaded but failed to save — try again")
        return
      }
      await update()
      router.refresh()
    }
  }

  // Skills
  const addSkill = (raw: string) => {
    const skill = raw.trim().replace(/,$/, "").trim()
    if (skill && !form.skills.map((s) => s.toLowerCase()).includes(skill.toLowerCase())) {
      setForm((f) => ({ ...f, skills: [...f.skills, skill] }))
    }
    setSkillInput("")
  }
  const removeSkill = (s: string) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))

  // Social links
  const setSocial = (id: string, val: string) =>
    setForm((f) => ({ ...f, socialLinks: { ...f.socialLinks, [id]: val } }))

  // Save
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/profile", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsOfExp: form.yearsOfExp ? parseInt(form.yearsOfExp, 10) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to save")
        toast.error(data.error ?? "Failed to save profile")
        return
      }
      await update()
      router.refresh()
      setSaved(true)
      toast.success("Profile updated successfully!")
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError("Network error — please try again.")
      toast.error("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  const completion = calcCompletion(form, !!avatarUrl)
  // Completion color
  const completionColor =
    completion >= 80 ? "from-green-500 to-emerald-400" :
    completion >= 50 ? "from-primary-500 to-accent-500" :
    "from-orange-500 to-amber-400"

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">

      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">How colleagues see you across Korpo</p>
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <Avatar className="h-24 w-24 ring-2 ring-border">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="text-2xl font-semibold">
                {getInitials(form.name || session?.user?.name)}
              </AvatarFallback>
            </Avatar>
            <label className="absolute bottom-0 right-0 h-8 w-8 bg-primary-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-md">
              <Camera className="h-3.5 w-3.5" />
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
            </label>
          </div>

          {/* Info + completion */}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-lg leading-tight truncate">
              {form.name || session?.user?.name || "Your Name"}
            </p>
            {form.username && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <AtSign className="h-3 w-3" />{form.username}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{session?.user?.email}</p>

            {/* Completion bar */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Profile strength</span>
                <span className={cn(
                  "text-xs font-semibold",
                  completion >= 80 ? "text-green-600 dark:text-green-400" :
                  completion >= 50 ? "text-primary-600 dark:text-primary-400" :
                  "text-orange-600 dark:text-orange-400"
                )}>
                  {completion}%
                </span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", completionColor)}
                  style={{ width: `${completion}%` }}
                />
              </div>
              {completion < 100 && (
                <p className="text-[10px] text-muted-foreground">
                  {completion < 50 ? "Add more details to help colleagues find and trust you." :
                   completion < 80 ? "Almost there — add social links and skills to complete your profile." :
                   "Great profile! Add any remaining details to reach 100%."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
              activeTab === id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>

        {/* ── Tab: Basic Info ── */}
        {activeTab === "basic" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Display Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>
                  Username
                  <span className="text-muted-foreground font-normal ml-1 text-xs">(optional)</span>
                </Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={form.username}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      }))
                    }
                    className="pl-9"
                    placeholder="your_handle"
                    maxLength={30}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Letters, numbers, underscores · 3–30 chars</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input
                  value={form.jobTitle}
                  onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input
                  value={form.department}
                  onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  placeholder="e.g. Engineering"
                />
              </div>
            </div>

            {/* Company — read-only, derived from work email domain */}
            {company && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Company
                </Label>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-input bg-muted/40 cursor-not-allowed opacity-70">
                  {company.logo ? (
                    <Image src={company.logo} alt={company.name} width={18} height={18} className="rounded-sm shrink-0" />
                  ) : (
                    <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <span className="text-sm">{company.name}</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Linked to your work email — cannot be changed here.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>City</Label>
                <CityAutocomplete
                  value={form.city}
                  onChange={(city) => setForm((f) => ({ ...f, city }))}
                  placeholder="Type a city name…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                  type="tel"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Years of Experience</Label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={form.yearsOfExp}
                  onChange={(e) => setForm((f) => ({ ...f, yearsOfExp: e.target.value }))}
                  placeholder="e.g. 5"
                  className="w-28"
                />
                {form.yearsOfExp && (
                  <span className="text-sm text-muted-foreground">
                    {form.yearsOfExp} year{parseInt(form.yearsOfExp) !== 1 ? "s" : ""} of experience
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Bio</Label>
                <span className="text-xs text-muted-foreground">{form.bio.length}/500</span>
              </div>
              <Textarea
                rows={5}
                maxLength={500}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell colleagues about yourself — your expertise, what you're working on, and what you're looking for…"
              />
            </div>
          </div>
        )}

        {/* ── Tab: Social Links ── */}
        {activeTab === "social" && (
          <div className="bg-card border border-border rounded-2xl p-6">
            <p className="text-sm text-muted-foreground mb-5">
              Add your social profiles so colleagues can connect with you outside Korpo.
              These appear on your public profile.
            </p>
            <div className="space-y-4">
              {PROFILE_SOCIAL_PLATFORMS.map(({ id, name, placeholder, textColor, icon: Icon }) => (
                <div key={id} className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border border-border bg-muted/50",
                    textColor
                  )}>
                    <Icon />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">{name}</p>
                    <Input
                      value={form.socialLinks[id] ?? ""}
                      onChange={(e) => setSocial(id, e.target.value)}
                      placeholder={placeholder}
                      className="h-9 text-sm"
                    />
                  </div>
                  {form.socialLinks[id] && (
                    <a
                      href={form.socialLinks[id]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                      title="Open link"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: Skills & Experience ── */}
        {activeTab === "skills" && (
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Add Skills</Label>
                <p className="text-xs text-muted-foreground">
                  Skills appear on your profile and help colleagues find you for the right opportunities.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault()
                      addSkill(skillInput)
                    }
                  }}
                  placeholder="Type a skill and press Enter…"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => addSkill(skillInput)}
                  disabled={!skillInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {form.skills.length > 0 ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  {form.skills.length} skill{form.skills.length !== 1 ? "s" : ""} added
                </p>
                <div className="flex flex-wrap gap-2">
                  {form.skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="h-4 w-4 flex items-center justify-center rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl border border-dashed border-border">
                <Sparkles className="h-5 w-5 text-muted-foreground shrink-0" />
                <p className="text-sm text-muted-foreground">
                  No skills yet. Add technologies, domains, or expertise you want colleagues to know about.
                </p>
              </div>
            )}

            {/* Popular suggestions */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Quick add</p>
              <div className="flex flex-wrap gap-1.5">
                {["React", "TypeScript", "Python", "Node.js", "SQL", "AWS", "Product Management",
                  "Data Analysis", "Machine Learning", "Figma", "Leadership", "Public Speaking",
                ].filter((s) => !form.skills.map((x) => x.toLowerCase()).includes(s.toLowerCase()))
                  .slice(0, 10)
                  .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="px-2.5 py-1 text-xs text-muted-foreground border border-border rounded-full hover:bg-muted hover:text-foreground transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Save button */}
        <div className="flex items-center gap-3 mt-5">
          <Button type="submit" className="flex-1 sm:flex-none sm:w-40" disabled={loading}>
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving…</>
            ) : saved ? (
              <><CheckCircle2 className="h-4 w-4 mr-2 text-green-400" />Saved!</>
            ) : (
              "Save Changes"
            )}
          </Button>
          {saved && (
            <p className="text-sm text-green-600 dark:text-green-400">Profile updated successfully.</p>
          )}
        </div>
      </form>
    </div>
  )
}
