"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { ArrowLeft, Flag, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn, formatRelativeTime } from "@/lib/utils"

const CATEGORIES = [
  { id: "BUG",             label: "Bug / something's broken" },
  { id: "FEATURE_REQUEST", label: "Feature request" },
  { id: "HARASSMENT",      label: "Harassment / inappropriate behavior" },
  { id: "PAYMENT",         label: "Payment / billing issue" },
  { id: "ACCOUNT",         label: "Account / verification issue" },
  { id: "OTHER",           label: "Other" },
]

const STATUS_STYLES: Record<string, string> = {
  OPEN:        "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  RESOLVED:    "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400",
  DISMISSED:   "bg-muted text-muted-foreground",
}

interface Grievance {
  id: string
  category: string
  message: string
  status: string
  createdAt: string
}

export default function ReportConcernPage() {
  const [category, setCategory] = useState("")
  const [message, setMessage]   = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [history, setHistory]   = useState<Grievance[]>([])

  const loadHistory = useCallback(() => {
    fetch("/api/grievances").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setHistory(d) })
  }, [])

  useEffect(() => { loadHistory() }, [loadHistory])

  const submit = async () => {
    setError("")
    if (!category) { setError("Please select a category."); return }
    if (message.trim().length < 10) { setError("Please describe the issue in at least 10 characters."); return }
    setLoading(true)
    try {
      const res = await fetch("/api/grievances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, message: message.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Couldn't submit. Please try again."); return }
      setSubmitted(true)
      setCategory("")
      setMessage("")
      loadHistory()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" />Back to Dashboard
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Flag className="h-5 w-5" /> Report a Concern</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Tell us about a bug, a grievance, or anything about the app that isn't working the way it should. Our team reviews every submission.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {submitted && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-400 text-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Thanks — your report was submitted. We'll follow up if needed.
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                  category === c.id ? "border-primary-500 bg-primary-500 text-white" : "border-border text-muted-foreground hover:border-muted-foreground/50"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>What's going on?</Label>
          <Textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe the issue — what you were doing, what you expected, and what happened instead…"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button onClick={submit} disabled={loading} className="w-full sm:w-auto">
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Submit report"}
        </Button>
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Clock className="h-4 w-4" /> Your past reports</h2>
          <div className="space-y-2">
            {history.map((g) => (
              <div key={g.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full", STATUS_STYLES[g.status] ?? "bg-muted text-muted-foreground")}>
                    {g.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">{g.category.replace(/_/g, " ")} · {formatRelativeTime(new Date(g.createdAt))}</span>
                </div>
                <p className="text-sm text-foreground/90">{g.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
