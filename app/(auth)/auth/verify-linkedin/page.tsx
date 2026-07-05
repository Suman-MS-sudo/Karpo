"use client"
import { useState, useRef, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShieldCheck, Loader2, Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerifyLinkedInPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(true)
  const [error, setError] = useState("")
  const [resendIn, setResendIn] = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  const sendCode = useCallback(async () => {
    setSending(true)
    setError("")
    try {
      const res = await fetch("/api/auth/verify-linkedin-otp/send", { method: "POST" })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to send code"); return }
      setResendIn(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } finally {
      setSending(false)
    }
  }, [])

  // Auto-send on first load
  useEffect(() => { sendCode() }, [sendCode])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const handleVerify = useCallback(async (code?: string) => {
    const finalCode = code ?? otp.join("")
    if (finalCode.length !== 6) return
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-linkedin-otp/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: finalCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Invalid or expired code. Please try again.")
        setOtp(["", "", "", "", "", ""])
        otpRefs.current[0]?.focus()
        return
      }
      await update()
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }, [otp, update, router])

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next  = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
    if (digit && index === 5 && next.every(Boolean)) handleVerify(next.join(""))
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus()
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length !== 6) return
    e.preventDefault()
    setOtp(pasted.split(""))
    otpRefs.current[5]?.focus()
    handleVerify(pasted)
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
      <div className="text-center mb-8">
        <div className="h-12 w-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Mail className="h-6 w-6 text-primary-600" />
        </div>
        <h1 className="text-2xl font-bold">Confirm your email</h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          To finish signing in with LinkedIn, we sent a 6-digit code to{" "}
          <span className="font-medium text-foreground">{session?.user?.email}</span>
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { otpRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                disabled={loading || sending}
                className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl
                  focus:border-primary-600 focus:ring-2 focus:ring-primary-200 focus:outline-none
                  bg-background transition-all
                  ${digit ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "border-border"}
                  ${loading || sending ? "opacity-50 cursor-not-allowed" : ""}
                `}
              />
            ))}
          </div>
        </div>

        <Button
          className="w-full"
          size="lg"
          disabled={loading || sending || otp.join("").length !== 6}
          onClick={() => handleVerify()}
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying…</> : "Verify & continue →"}
        </Button>

        <div className="flex items-center justify-center text-sm pt-1">
          {resendIn > 0 ? (
            <span className="text-muted-foreground">Resend in {resendIn}s</span>
          ) : (
            <button
              type="button"
              onClick={sendCode}
              disabled={sending}
              className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Resend code
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-start gap-3 bg-surface rounded-xl p-4 border border-border">
        <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-0.5">One extra step for LinkedIn sign-in</p>
          <p>Since LinkedIn accounts can use personal inboxes, we confirm you own this email before granting full access.</p>
        </div>
      </div>
    </div>
  )
}
