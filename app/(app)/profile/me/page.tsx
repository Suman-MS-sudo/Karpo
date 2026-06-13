"use client"
import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Camera, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CITIES } from "@/config/services"
import { getInitials } from "@/lib/utils"

export default function EditProfilePage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: "",
    bio: "",
    city: "",
    jobTitle: "",
    department: "",
  })

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name ?? "",
        bio: "",
        city: session.user.city ?? "",
        jobTitle: "",
        department: "",
      })
      // Fetch full profile
      fetch("/api/profile").then((r) => r.json()).then((d) => {
        if (d) setForm({ name: d.name ?? "", bio: d.bio ?? "", city: d.city ?? "", jobTitle: d.jobTitle ?? "", department: d.department ?? "" })
      })
    }
  }, [session])

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    const data = await res.json()
    if (data.url) {
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatarUrl: data.url }) })
      await update()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      await update()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-8">
        <div className="relative">
          <Avatar className="h-20 w-20">
            <AvatarImage src={session?.user?.avatarUrl ?? session?.user?.image ?? ""} />
            <AvatarFallback className="text-xl">{getInitials(session?.user?.name)}</AvatarFallback>
          </Avatar>
          <label className="absolute bottom-0 right-0 h-7 w-7 bg-primary-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
            <Camera className="h-3.5 w-3.5" />
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="sr-only" />
          </label>
        </div>
        <div>
          <p className="font-medium">{session?.user?.name}</p>
          <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
          {session?.user?.company && <p className="text-sm text-muted-foreground">{session.user.company.name}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Display Name</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>

        <div className="space-y-1.5">
          <Label>City</Label>
          <Select value={form.city} onValueChange={(v) => setForm((f) => ({ ...f, city: v }))}>
            <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
            <SelectContent>{CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Job Title</Label>
            <Input placeholder="e.g. Software Engineer" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Input placeholder="e.g. Engineering" value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Bio</Label>
          <Textarea rows={4} placeholder="Tell colleagues about yourself…" value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> :
           saved ? <><CheckCircle2 className="h-4 w-4" /> Saved!</> : "Save Changes"}
        </Button>
      </form>
    </div>
  )
}
