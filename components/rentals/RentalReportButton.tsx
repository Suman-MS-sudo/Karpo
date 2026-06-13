"use client"

import { useState } from "react"
import { Flag, X, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const REASONS = [
  "Fake / fraudulent listing",
  "Already filled / unavailable",
  "Misleading photos or description",
  "Inappropriate content",
  "Wrong price information",
  "Spam or duplicate listing",
  "Other",
]

interface Props { rentalId: string }

export function RentalReportButton({ rentalId }: Props) {
  const [open, setOpen]       = useState(false)
  const [reason, setReason]   = useState("")
  const [details, setDetails] = useState("")
  const [status, setStatus]   = useState<"idle" | "loading" | "done">("idle")

  const submit = async () => {
    if (!reason) return
    setStatus("loading")
    await fetch(`/api/rentals/${rentalId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason, details: details.trim() || undefined }),
    })
    setStatus("done")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        <Flag className="h-3.5 w-3.5" /> Report
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            {status === "done" ? (
              <div className="text-center py-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
                <p className="font-semibold">Report submitted</p>
                <p className="text-xs text-muted-foreground mt-1">Our team will review this listing.</p>
                <Button className="mt-4 w-full" onClick={() => { setOpen(false); setStatus("idle"); setReason(""); setDetails("") }}>Close</Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Report listing</h3>
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Select a reason:</p>
                <div className="space-y-1.5 mb-4">
                  {REASONS.map((r) => (
                    <button key={r} onClick={() => setReason(r)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm border transition-all ${reason === r ? "border-primary-600 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300" : "border-border hover:border-foreground/20 text-foreground"}`}>
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-600/50 placeholder:text-muted-foreground mb-3"
                  rows={2}
                  placeholder="Additional details (optional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
                <Button className="w-full gap-2" disabled={!reason || status === "loading"} onClick={submit}>
                  {status === "loading" ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : "Submit Report"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
