"use client"
import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Loader2, CheckCircle2, Upload, ShieldCheck, Mail, IdCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Method = "otp" | "idcard"

export function ReverifyWorkEmail({ fullName, phone, onVerified }: { fullName: string; phone: string; onVerified?: () => void }) {
  const { update } = useSession()
  const [open, setOpen] = useState(false)
  const [method, setMethod] = useState<Method>("otp")
  const [error, setError] = useState("")

  // ── OTP path ──
  const [otpEmail, setOtpEmail] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpDone, setOtpDone] = useState(false)

  const sendOtp = useCallback(async () => {
    setError("")
    setOtpLoading(true)
    try {
      const res = await fetch("/api/profile/work-email/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Couldn't send code."); return }
      setOtpSent(true)
      toast.success("Code sent — check your inbox")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setOtpLoading(false)
    }
  }, [otpEmail])

  const verifyOtp = useCallback(async () => {
    setError("")
    setOtpLoading(true)
    try {
      const res = await fetch("/api/profile/work-email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: otpEmail.trim().toLowerCase(), otp: otp.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Invalid or expired code."); return }
      await update()
      setOtpDone(true)
      toast.success("Work email updated!")
      onVerified?.()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setOtpLoading(false)
    }
  }, [otpEmail, otp, update, onVerified])

  // ── ID card path ──
  const [idCorpEmail, setIdCorpEmail]     = useState("")
  const [idDesignation, setIdDesignation] = useState("")
  const [idEmployeeId, setIdEmployeeId]   = useState("")
  const [idFront, setIdFront] = useState<{ file: File; url: string } | null>(null)
  const [idBack, setIdBack]   = useState<{ file: File; url: string } | null>(null)
  const [idUploading, setIdUploading] = useState<"front" | "back" | null>(null)
  const [idSubmitting, setIdSubmitting] = useState(false)
  const [idSubmitted, setIdSubmitted] = useState(false)

  const handleIdImageUpload = useCallback(async (side: "front" | "back", file: File) => {
    setError("")
    setIdUploading(side)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/id-verification/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Upload failed"); return }
      const entry = { file, url: data.url as string }
      if (side === "front") setIdFront(entry)
      else setIdBack(entry)
    } catch {
      setError("Upload failed. Please try again.")
    } finally {
      setIdUploading(null)
    }
  }, [])

  const submitIdCard = useCallback(async () => {
    setError("")
    if (!idCorpEmail.trim().includes("@")) { setError("Enter your new work email."); return }
    if (!idFront || !idBack) { setError("Please upload both sides of your ID card."); return }
    if (!fullName.trim() || !phone.trim()) { setError("Add your name and phone in your profile first."); return }
    setIdSubmitting(true)
    try {
      const res = await fetch("/api/profile/work-email/id-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corpEmail: idCorpEmail.trim().toLowerCase(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          designation: idDesignation.trim() || undefined,
          employeeId: idEmployeeId.trim() || undefined,
          frontImageUrl: idFront.url,
          backImageUrl: idBack.url,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Couldn't submit your request."); return }
      setIdSubmitted(true)
      toast.success("Submitted for admin review")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIdSubmitting(false)
    }
  }, [idCorpEmail, fullName, phone, idDesignation, idEmployeeId, idFront, idBack])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-primary hover:underline"
      >
        Switched companies? Re-verify your work email →
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Re-verify work email</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>

      {otpDone || idSubmitted ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          {otpDone
            ? "Your work email has been updated."
            : "Your ID card was submitted — an admin will review it shortly."}
        </div>
      ) : (
        <>
          <div className="flex gap-1 p-1 bg-muted rounded-lg">
            {([
              { id: "otp",    label: "Email + OTP", icon: Mail },
              { id: "idcard", label: "Submit ID card", icon: IdCard },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => { setMethod(id); setError("") }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md transition-all",
                  method === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />{label}
              </button>
            ))}
          </div>

          {method === "otp" && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>New work email</Label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="you@neworg.com"
                    value={otpEmail}
                    disabled={otpSent}
                    onChange={(e) => setOtpEmail(e.target.value)}
                  />
                  {!otpSent && (
                    <Button type="button" onClick={sendOtp} disabled={otpLoading || !otpEmail.includes("@")}>
                      {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                    </Button>
                  )}
                </div>
              </div>
              {otpSent && (
                <div className="space-y-1.5">
                  <Label>Enter code</Label>
                  <div className="flex gap-2">
                    <Input
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="6-digit code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    />
                    <Button type="button" onClick={verifyOtp} disabled={otpLoading || otp.length !== 6}>
                      {otpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                  <button type="button" onClick={sendOtp} className="text-xs text-muted-foreground hover:text-foreground">
                    Resend code
                  </button>
                </div>
              )}
            </div>
          )}

          {method === "idcard" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>New work email</Label>
                  <Input type="email" placeholder="you@neworg.com" value={idCorpEmail} onChange={(e) => setIdCorpEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Designation <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={idDesignation} onChange={(e) => setIdDesignation(e.target.value)} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Employee ID <span className="text-muted-foreground font-normal">(optional)</span></Label>
                  <Input value={idEmployeeId} onChange={(e) => setIdEmployeeId(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>ID card — front side</Label>
                <label className="flex items-center gap-3 border border-dashed border-border rounded-xl p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleIdImageUpload("front", f) }} />
                  {idUploading === "front" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : idFront ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground truncate">
                    {idFront ? idFront.file.name : "Upload front side"}
                  </span>
                </label>
              </div>

              <div className="space-y-1.5">
                <Label>ID card — back side</Label>
                <label className="flex items-center gap-3 border border-dashed border-border rounded-xl p-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input type="file" accept="image/*" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleIdImageUpload("back", f) }} />
                  {idUploading === "back" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : idBack ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Upload className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground truncate">
                    {idBack ? idBack.file.name : "Upload back side"}
                  </span>
                </label>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={submitIdCard}
                disabled={idSubmitting || idUploading !== null || !idFront || !idBack || !idCorpEmail.trim().includes("@")}
              >
                {idSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Submit for review"}
              </Button>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </>
      )}
    </div>
  )
}
