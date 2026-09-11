"use client"
import { useState } from "react"
import { Flag, X, Loader2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const REASONS = [
  "Fake or impersonated profile",
  "Harassment or abusive behavior",
  "Scam or fraud attempt",
  "Inappropriate or offensive content",
  "Spam or unwanted solicitation",
  "Other",
]

export function ReportUserButton({ userId, userName }: { userId: string; userName: string | null }) {
  const [open, setOpen]       = useState(false)
  const [reason, setReason]   = useState("")
  const [details, setDetails] = useState("")
  const [status, setStatus]   = useState<"idle" | "loading" | "done" | "error">("idle")
  const [error, setError]     = useState("")

  const name = userName ?? "this user"

  const close = () => {
    setOpen(false)
    setStatus("idle")
    setReason("")
    setDetails("")
    setError("")
  }

  const submit = async () => {
    if (!reason) return
    setStatus("loading")
    setError("")
    try {
      const res  = await fetch(`/api/users/${userId}/report`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ reason, details }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Something went wrong")
        setStatus("error")
        return
      }
      setStatus("done")
    } catch {
      setError("Network error — please try again.")
      setStatus("error")
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-9 px-0 sm:w-auto sm:px-3 gap-1.5"
        onClick={() => setOpen(true)}
        title="Report"
      >
        <Flag className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Report</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Report {name}</h3>
              <button
                onClick={close}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {status === "done" ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-medium">Report submitted</p>
                <p className="text-sm text-muted-foreground mt-1">Our team reviews reports within 24 hours.</p>
                <Button size="sm" className="mt-5 w-full" onClick={close}>Done</Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">Why are you reporting this user?</p>
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
                  placeholder="Additional details — what happened, when, and any relevant links (optional)"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground mb-2"
                />
                {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
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
