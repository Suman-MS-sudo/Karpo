"use client"
import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

function NewConciergForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    serviceType: params.get("type") ?? "",
    description: "",
    urgency: "NORMAL",
    budget: "",
    timeline: "",
    phone: "",
    preferredContact: "EMAIL",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch("/api/concierge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (res.ok) router.push(`/concierge/${d.id}`)
      else alert(d.error ?? "Failed to submit request")
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Request Details</h2>
        <div className="space-y-1.5">
          <Label>Service Type *</Label>
          <Select required value={form.serviceType} onValueChange={(v) => setForm((f) => ({ ...f, serviceType: v }))}>
            <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="TAX">📄 Tax Filing — ITR, tax planning, form 16</SelectItem>
              <SelectItem value="LEGAL">⚖️ Legal Assistance — Contracts, disputes</SelectItem>
              <SelectItem value="INSURANCE">🛡️ Insurance Advisory — Health, life, vehicle</SelectItem>
              <SelectItem value="FINANCIAL">📈 Financial Planning — Investments, retirement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Describe your requirement *</Label>
          <Textarea
            required rows={5}
            placeholder="Tell us what you need help with. The more detail, the better we can match you."
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Priority & Budget</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Urgency</Label>
            <Select value={form.urgency} onValueChange={(v) => setForm((f) => ({ ...f, urgency: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="URGENT">🔴 Urgent — within 24 hours</SelectItem>
                <SelectItem value="NORMAL">🟡 Normal — within a week</SelectItem>
                <SelectItem value="LOW">🟢 Low — no rush</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Budget (₹, optional)</Label>
            <Input
              type="number" min="0"
              placeholder="e.g. 5000"
              value={form.budget}
              onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Timeline / Deadline</Label>
          <Input
            placeholder="e.g. Before March 31 (tax deadline), Within 2 weeks"
            value={form.timeline}
            onChange={(e) => setForm((f) => ({ ...f, timeline: e.target.value }))}
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold">Contact Preferences</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Preferred contact method</Label>
            <Select value={form.preferredContact} onValueChange={(v) => setForm((f) => ({ ...f, preferredContact: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EMAIL">✉️ Email</SelectItem>
                <SelectItem value="PHONE">📞 Phone call</SelectItem>
                <SelectItem value="WHATSAPP">💬 WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Phone (optional)</Label>
            <Input
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm">
        <p className="font-medium text-blue-800 dark:text-blue-300">What happens next?</p>
        <p className="text-blue-700 dark:text-blue-400 mt-1">Our team will review your request and connect you with a vetted professional within 1–2 business days. You can track your request status from My Requests.</p>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Submit Request"}
      </Button>
    </form>
  )
}

export default function NewConciergePage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link href="/concierge" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to Concierge
      </Link>
      <h1 className="text-2xl font-bold mb-2">Submit a Request</h1>
      <p className="text-muted-foreground text-sm mb-6">Get connected with a vetted professional for tax, legal, insurance, or financial needs.</p>
      <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading…</div>}>
        <NewConciergForm />
      </Suspense>
    </div>
  )
}
