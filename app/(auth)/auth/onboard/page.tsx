"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { User, MapPin, Briefcase, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CITIES } from "@/config/services"

export default function OnboardPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: session?.user?.name ?? "",
    city: "",
    department: "",
    jobTitle: "",
    bio: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        await update()
        router.push("/dashboard")
      }
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
          <Select
            required
            value={form.city}
            onValueChange={(v) => setForm((f) => ({ ...f, city: v }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select your city" />
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((city) => (
                <SelectItem key={city} value={city}>{city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <Button type="submit" className="w-full" size="lg" disabled={loading || !form.city}>
          {loading ? "Saving…" : "Complete Setup"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
