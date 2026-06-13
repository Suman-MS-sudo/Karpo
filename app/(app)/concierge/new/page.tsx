"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function NewConciergePage() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    serviceType: params.get("type") ?? "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch("/api/concierge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) router.push("/concierge?submitted=true")
      else alert("Failed to submit request")
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/concierge" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Concierge
      </Link>
      <h1 className="text-2xl font-bold mb-6">Submit a Request</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label>Service Type *</Label>
          <Select required value={form.serviceType} onValueChange={(v) => setForm((f) => ({ ...f, serviceType: v }))}>
            <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TAX">Tax Filing</SelectItem>
              <SelectItem value="LEGAL">Legal Assistance</SelectItem>
              <SelectItem value="INSURANCE">Insurance Advisory</SelectItem>
              <SelectItem value="FINANCIAL">Financial Planning</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Describe your requirement *</Label>
          <Textarea required rows={6} placeholder="Tell us what you need help with. The more detail you provide, the better we can match you with the right professional." value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm">
          <p className="font-medium text-blue-800">What happens next?</p>
          <p className="text-blue-700 mt-1">Our team will review your request and connect you with a vetted professional within 1-2 business days.</p>
        </div>
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Request"}
        </Button>
      </form>
    </div>
  )
}
