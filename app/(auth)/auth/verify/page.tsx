"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Building2, ArrowRight, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function VerifyPage() {
  const { data: session } = useSession()
  // const status = params.get("status") - reserved for future use

  const [form, setForm] = useState({
    companyName: "",
    domain: session?.user?.email?.split("@")[1] ?? "",
    city: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/companies/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.companyName, domain: form.domain, city: form.city, requestedBy: session?.user?.email }),
      })
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center">
        <div className="h-16 w-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Request submitted!</h1>
        <p className="text-muted-foreground mb-6">
          We&apos;ll review your company domain and get back within 24 hours. We&apos;ll notify you at <strong>{session?.user?.email}</strong>.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center">
          <Building2 className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Company not listed yet</h1>
          <p className="text-sm text-muted-foreground">Your domain <strong>{form.domain}</strong> isn&apos;t in our approved list</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Submit your company details and our team will review and approve within 24 hours. Once approved, you&apos;ll get full access.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Company Name</Label>
          <Input
            required
            placeholder="e.g. Tata Consultancy Services"
            value={form.companyName}
            onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Corporate Domain</Label>
          <Input value={form.domain} readOnly className="bg-muted" />
        </div>
        <div className="space-y-1.5">
          <Label>City / HQ Location</Label>
          <Input
            placeholder="e.g. Hyderabad"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Submitting…" : "Submit for Review"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
