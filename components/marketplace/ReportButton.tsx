"use client"
import { useState } from "react"
import { Flag, X, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const REASONS = [
  "Fake or misleading listing",
  "Prohibited or illegal item",
  "Wrong category",
  "Spam or duplicate listing",
  "Seller is unresponsive / scam",
  "Price is fraudulent",
  "Other",
]

export function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen]       = useState(false)
  const [reason, setReason]   = useState("")
  const [details, setDetails] = useState("")
  const [status, setStatus]   = useState<"idle" | "loading" | "done">("idle")

  const submit = async () => {
    if (!reason) return
    setStatus("loading")
    try {
      await fetch(`/api/listings/${listingId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, details }),
      })
      setStatus("done")
    } catch {
      setStatus("idle")
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors mt-3"
      >
        <Flag className="h-3.5 w-3.5" /> Report this listing
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Report listing</h3>
              <button onClick={() => { setOpen(false); setStatus("idle"); setReason(""); setDetails("") }}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {status === "done" ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-medium">Report submitted</p>
                <p className="text-sm text-muted-foreground mt-1">We review reports within 24 hours.</p>
                <Button size="sm" className="mt-5 w-full" onClick={() => { setOpen(false); setStatus("idle") }}>
                  Done
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">Why are you reporting this listing?</p>
                <div className="space-y-2 mb-4">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                        reason === r
                          ? "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 font-medium"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <textarea
                  placeholder="Additional details (optional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={2}
                  maxLength={500}
                  className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground mb-4"
                />
                <Button
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={!reason || status === "loading"}
                  onClick={submit}
                >
                  {status === "loading" ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Submit report"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
