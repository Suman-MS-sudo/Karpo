"use client"
import { useState } from "react"
import { Loader2, CheckCircle2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const SUBJECTS = [
  "General enquiry",
  "Company domain request",
  "Account or verification issue",
  "Report a listing / user",
  "Partnership or business",
  "Premium billing",
  "Bug report",
  "Other",
]

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setStatus("success")
        setForm({ name: "", email: "", subject: "", message: "" })
      } else {
        const data = await res.json().catch(() => ({}))
        setErrorMsg(data.error ?? "Something went wrong. Please try again.")
        setStatus("error")
      }
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.")
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-emerald-200 rounded-2xl bg-emerald-50">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
        <h3 className="text-xl font-bold text-emerald-800 mb-2">Message sent!</h3>
        <p className="text-emerald-700 text-sm max-w-xs">
          Thanks for reaching out. We&apos;ll get back to you within one business day.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm text-emerald-600 underline underline-offset-4 hover:text-emerald-700"
        >
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="contact-name">Your name *</Label>
          <Input
            id="contact-name"
            required
            placeholder="Priya Sharma"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email address *</Label>
          <Input
            id="contact-email"
            required
            type="email"
            placeholder="priya@yourcompany.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-subject">Subject *</Label>
        <select
          id="contact-subject"
          required
          value={form.subject}
          onChange={(e) => set("subject", e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer text-foreground"
        >
          <option value="" disabled>Select a subject…</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message *</Label>
        <Textarea
          id="contact-message"
          required
          rows={6}
          placeholder="Describe your question or issue in as much detail as you can…"
          value={form.message}
          onChange={(e) => set("message", e.target.value)}
          maxLength={2000}
        />
        <p className="text-xs text-gray-400">{form.message.length}/2000</p>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          {errorMsg}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2 bg-[#1E3A5F] hover:bg-[#16304F] text-white"
        disabled={status === "loading"}
      >
        {status === "loading"
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
          : <><Send className="h-4 w-4" /> Send message</>
        }
      </Button>
    </form>
  )
}
