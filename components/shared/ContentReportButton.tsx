"use client"

import { useState } from "react"
import { Flag, X, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const REASONS = [
  "Fake or misleading post",
  "Prohibited or illegal content",
  "Inappropriate content",
  "Spam or duplicate",
  "Scam or fraud",
  "Wrong category or information",
  "Other",
]

interface Props {
  itemType: "RENTAL" | "SKILL" | "EVENT" | "REFERRAL" | "CARPOOL"
  itemId: string
  /** Shown in the dialog title, e.g. "rental" -> "Report rental". */
  noun: string
  className?: string
  /** Flag icon only (for toolbars beside the wishlist/share icons). */
  iconOnly?: boolean
}

export function ContentReportButton({ itemType, itemId, noun, className, iconOnly }: Props) {
  const [open, setOpen]       = useState(false)
  const [reason, setReason]   = useState("")
  const [details, setDetails] = useState("")
  const [status, setStatus]   = useState<"idle" | "loading" | "done" | "error">("idle")

  const close = () => { setOpen(false); setStatus("idle"); setReason(""); setDetails("") }

  const submit = async () => {
    if (!reason) return
    setStatus("loading")
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemType, itemId, reason, details: details.trim() || undefined }),
      })
      setStatus(res.ok ? "done" : "error")
    } catch {
      setStatus("error")
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={`Report ${noun}`}
        aria-label={`Report ${noun}`}
        className={className ?? (iconOnly
          ? "h-9 w-9 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-red-500 transition-colors"
          : "flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors")}
      >
        <Flag className="h-3.5 w-3.5" />{!iconOnly && " Report"}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Report {noun}</h3>
              <button type="button" onClick={close} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {status === "done" ? (
              <div className="text-center py-6">
                <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
                <p className="font-medium">Report submitted</p>
                <p className="text-sm text-muted-foreground mt-1">Our team will review it shortly.</p>
                <Button size="sm" className="mt-5 w-full" onClick={close}>Done</Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">Why are you reporting this {noun}?</p>
                <div className="space-y-2 mb-4">
                  {REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
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
                  className="w-full text-sm rounded-lg border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground mb-3"
                />
                {status === "error" && <p className="text-xs text-red-600 mb-3">Couldn&apos;t submit the report. Please try again.</p>}
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
