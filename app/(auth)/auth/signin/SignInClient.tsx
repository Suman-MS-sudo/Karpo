"use client"
import { Suspense, useState, useRef, useEffect, useCallback } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, ArrowLeft, Loader2, Mail, RefreshCw } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = "email" | "otp"

function SignInContent({ linkedinAvailable }: { linkedinAvailable: boolean }) {
  const params      = useSearchParams()
  const router      = useRouter()
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard"

  const [step, setStep]       = useState<Step>("email")
  const [email, setEmail]     = useState("")
  const [otp, setOtp]         = useState(["", "", "", "", "", ""])
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [resendIn, setResendIn] = useState(0)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend button
  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  // ── Step 1: send OTP ────────────────────────────────────────────────────────
  const handleSendOTP = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res  = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to send code"); return }
      setIsNewUser(data.isNewUser)
      setStep("otp")
      setResendIn(60)
      if (data.devOtp) {
        const digits = String(data.devOtp).split("")
        setOtp(digits)
        setTimeout(() => handleVerifyOTP(data.devOtp), 300)
        return
      }
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
  }, [email])

  // ── OTP box keyboard handling ───────────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next  = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) otpRefs.current[index + 1]?.focus()
    // Auto-submit when all 6 digits filled
    if (digit && index === 5 && next.every(Boolean)) {
      handleVerifyOTP(next.join(""))
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) otpRefs.current[index - 1]?.focus()
    if (e.key === "ArrowRight" && index < 5) otpRefs.current[index + 1]?.focus()
  }

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length !== 6) return
    e.preventDefault()
    const digits = pasted.split("")
    setOtp(digits)
    otpRefs.current[5]?.focus()
    handleVerifyOTP(pasted)
  }

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const handleVerifyOTP = useCallback(async (code?: string) => {
    const finalCode = code ?? otp.join("")
    if (finalCode.length !== 6) return
    setError("")
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        otp: finalCode,
      })
      if (result?.error) {
        setError("Invalid or expired code. Please try again.")
        setOtp(["", "", "", "", "", ""])
        otpRefs.current[0]?.focus()
        return
      }
      // Check session role to handle admin bypass onboarding
      const sessionRes = await fetch("/api/auth/session")
      const sessionData = sessionRes.ok ? await sessionRes.json() : null
      const isAdmin = sessionData?.user?.role === "ADMIN"

      if (isAdmin) {
        router.push(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin")
      } else if (isNewUser) {
        router.push("/auth/onboard")
      } else {
        router.push(callbackUrl)
      }
    } finally {
      setLoading(false)
    }
  }, [email, otp, isNewUser, callbackUrl, router])

  const [linkedinLoading, setLinkedinLoading] = useState(false)
  const handleLinkedInSignIn = useCallback(() => {
    setLinkedinLoading(true)
    signIn("linkedin", { callbackUrl })
  }, [callbackUrl])

  const urlError = params.get("error")

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Image src="/logo.png" alt="Korpo" width={40} height={40} className="rounded-xl object-contain" />
          <span className="font-bold text-2xl text-primary-600">Korpo</span>
        </Link>
        {step === "email" ? (
          <>
            <h1 className="text-2xl font-bold">Sign in to Korpo</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Enter your corporate email to get started
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold">{isNewUser ? "Verify your email" : "Enter your code"}</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
            </p>
          </>
        )}
      </div>

      {/* Error banner */}
      {(error || urlError) && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
          {error || (
            urlError === "OAuthAccountNotLinked"
              ? "This email is linked to another sign-in method."
              : urlError === "domain_blocked"
              ? "Temporary or disposable email addresses are not allowed, even via LinkedIn."
              : "Something went wrong. Please try again."
          )}
        </div>
      )}

      {/* ── Step 1: Email input ──────────────────────────────────────────────── */}
      {step === "email" && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Corporate email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@yourcompany.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Gmail, Yahoo, Outlook and temporary addresses are blocked.
            </p>
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || !email.includes("@")}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending code…</> : "Send verification code →"}
          </Button>

          {linkedinAvailable && (
            <>
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">OR</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                onClick={handleLinkedInSignIn}
                disabled={linkedinLoading}
              >
                {linkedinLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z" />
                  </svg>
                )}
                Continue with LinkedIn
              </Button>
            </>
          )}
        </form>
      )}

      {/* ── Step 2: OTP input ────────────────────────────────────────────────── */}
      {step === "otp" && (
        <div className="space-y-5">
          {/* 6-digit OTP boxes */}
          <div>
            <Label className="block text-center mb-3">Enter the 6-digit code</Label>
            <div
              className="flex gap-2 justify-center"
              onPaste={handleOtpPaste}
            >
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
                  disabled={loading}
                  className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl
                    focus:border-primary-600 focus:ring-2 focus:ring-primary-200 focus:outline-none
                    bg-background transition-all
                    ${digit ? "border-primary-400 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300" : "border-border"}
                    ${loading ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                />
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={loading || otp.join("").length !== 6}
            onClick={() => handleVerifyOTP()}
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying…</> : "Verify & Sign in →"}
          </Button>

          {/* Resend + back */}
          <div className="flex items-center justify-between text-sm pt-1">
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError("") }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Change email
            </button>
            {resendIn > 0 ? (
              <span className="text-muted-foreground">Resend in {resendIn}s</span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOTP()}
                disabled={loading}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Resend code
              </button>
            )}
          </div>

          {isNewUser && (
            <div className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 text-xs text-green-800 dark:text-green-400 text-center">
              🎉 New account will be created for <strong>{email}</strong>
            </div>
          )}
        </div>
      )}

      {/* Trust badge */}
      <div className="mt-6 flex items-start gap-3 bg-surface rounded-xl p-4 border border-border">
        <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-0.5">Corporate emails only</p>
          <p>Personal (Gmail, Yahoo, Outlook), temporary, and disposable addresses are not accepted. OTP verifies you own the address.</p>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground mt-5">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">Terms</Link> and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>
      </p>
    </div>
  )
}

export default function SignInClient({ linkedinAvailable }: { linkedinAvailable: boolean }) {
  return (
    <Suspense>
      <SignInContent linkedinAvailable={linkedinAvailable} />
    </Suspense>
  )
}
