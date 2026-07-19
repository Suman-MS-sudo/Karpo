"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { User, MapPin, Briefcase, ArrowRight, Droplet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { CityAutocomplete } from "@/components/ui/city-autocomplete"

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export default function OnboardPage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: session?.user?.name ?? "",
    city: "",
    department: "",
    jobTitle: "",
    bio: "",
    bloodGroup: "",
    bloodDonationOptIn: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? "Something went wrong. Please try again.")
        return
      }
      await update()
      // Full reload so the server re-reads the freshly updated session/cookie
      // before the (app) layout's onboarding-completion check runs again.
      window.location.href = "/dashboard"
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <User className="h-6 w-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Set up your profile</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Help colleagues know who you are. Takes 30 seconds.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Display Name</Label>
          <Input
            required
            placeholder="Your full name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5" /> City</Label>
          <CityAutocomplete
            value={form.city}
            onChange={(city) => setForm((f) => ({ ...f, city }))}
            placeholder="Type your city…"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5" /> Job Title</Label>
            <Input
              placeholder="e.g. Software Engineer"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Input
              placeholder="e.g. Engineering"
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Short Bio <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <Textarea
            placeholder="Tell colleagues a bit about yourself…"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
          />
        </div>

        <div className="space-y-2 rounded-xl border border-border p-4">
          <Label className="flex items-center gap-2"><Droplet className="h-3.5 w-3.5" /> Blood Group <span className="text-muted-foreground font-normal">(optional)</span></Label>
          <div className="flex flex-wrap gap-2">
            {BLOOD_GROUPS.map((bg) => (
              <button
                key={bg}
                type="button"
                onClick={() => setForm((f) => ({ ...f, bloodGroup: f.bloodGroup === bg ? "" : bg }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.bloodGroup === bg
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-input hover:bg-muted"
                }`}
              >
                {bg}
              </button>
            ))}
          </div>
          <label className="flex items-start gap-2 pt-1 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={form.bloodDonationOptIn}
              onChange={(e) => setForm((f) => ({ ...f, bloodDonationOptIn: e.target.checked }))}
            />
            I consent to share my blood group with Korpo and be notified when a colleague nearby needs my blood type for donation.
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" className="w-full" size="lg" disabled={loading || !form.city}>
          {loading ? "Saving…" : "Complete Setup"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
