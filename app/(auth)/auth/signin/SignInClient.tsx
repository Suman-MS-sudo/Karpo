"use client"
import { Suspense, useState, useRef, useEffect, useCallback } from "react"
import { signIn } from "next-auth/react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, ArrowLeft, ArrowRight, Loader2, Mail, RefreshCw, IdCard, Upload, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Step = "signin" | "register-choice" | "otp" | "password" | "idcard" | "idcard-submitted" | "register" | "phone" | "phone-otp" | "email-otp"

function SignInContent({ linkedinAvailable }: { linkedinAvailable: boolean }) {
  const params      = useSearchParams()
  const router      = useRouter()
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard"

  const [step, setStep]       = useState<Step>(params.get("mode") === "register" ? "register-choice" : "signin")
  const [email, setEmail]     = useState("")
  const [otp, setOtp]         = useState(["", "", "", "", "", ""])
  const [isNewUser, setIsNewUser] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")
  const [resendIn, setResendIn] = useState(0)
  const [password, setPassword] = useState("")

  // ── Registration (Name/Corp email/Phone/Password, upfront) ─────────────────
  const [regName, setRegName]         = useState("")
  const [regPhone, setRegPhone]       = useState("")
  const [regPassword, setRegPassword] = useState("")
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("")
  const [registering, setRegistering] = useState(false)

  // ── WhatsApp OTP login (returning users) ────────────────────────────────────
  const [waPhone, setWaPhone]   = useState("")
  const [waOtp, setWaOtp]       = useState(["", "", "", "", "", ""])
  const [waResendIn, setWaResendIn] = useState(0)
  const waOtpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (waResendIn <= 0) return
    const t = setTimeout(() => setWaResendIn((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [waResendIn])

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
        ...(registering ? { name: regName.trim(), phone: regPhone.trim(), newPassword: regPassword } : {}),
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
  }, [email, otp, isNewUser, callbackUrl, router, registering, regName, regPhone, regPassword])

  // ── Registration: submit Name/Email/Phone/Password, then send email OTP ───
  const handleRegisterSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    if (regPassword.length < 8) { setError("Password must be at least 8 characters."); return }
    if (regPassword !== regPasswordConfirm) { setError("Passwords don't match."); return }
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
      setRegistering(true)
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
  }, [email, regPassword, regPasswordConfirm, handleVerifyOTP])

  // ── WhatsApp OTP login: step 1, send code ───────────────────────────────────
  const handleSendWhatsAppOTP = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res  = await fetch("/api/auth/send-whatsapp-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: waPhone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Failed to send code"); return }
      setStep("phone-otp")
      setWaResendIn(60)
      if (data.devOtp) {
        const digits = String(data.devOtp).split("")
        setWaOtp(digits)
        setTimeout(() => handleVerifyWhatsAppOTP(data.devOtp), 300)
        return
      }
      setTimeout(() => waOtpRefs.current[0]?.focus(), 50)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waPhone])

  // ── WhatsApp OTP login: step 2, verify code ─────────────────────────────────
  const handleVerifyWhatsAppOTP = useCallback(async (code?: string) => {
    const finalCode = code ?? waOtp.join("")
    if (finalCode.length !== 6) return
    setError("")
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        redirect: false,
        phone: waPhone.trim(),
        whatsappOtp: finalCode,
      })
      if (result?.error) {
        setError("Invalid or expired code. Please try again.")
        setWaOtp(["", "", "", "", "", ""])
        waOtpRefs.current[0]?.focus()
        return
      }
      const sessionRes = await fetch("/api/auth/session")
      const sessionData = sessionRes.ok ? await sessionRes.json() : null
      const isAdmin = sessionData?.user?.role === "ADMIN"
      router.push(isAdmin ? (callbackUrl.startsWith("/admin") ? callbackUrl : "/admin") : callbackUrl)
    } finally {
      setLoading(false)
    }
  }, [waPhone, waOtp, callbackUrl, router])

  const handleWaOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1)
    const next  = [...waOtp]
    next[index] = digit
    setWaOtp(next)
    if (digit && index < 5) waOtpRefs.current[index + 1]?.focus()
    if (digit && index === 5 && next.every(Boolean)) {
      handleVerifyWhatsAppOTP(next.join(""))
    }
  }

  const handleWaOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !waOtp[index] && index > 0) waOtpRefs.current[index - 1]?.focus()
    if (e.key === "ArrowLeft" && index > 0) waOtpRefs.current[index - 1]?.focus()
    if (e.key === "ArrowRight" && index < 5) waOtpRefs.current[index + 1]?.focus()
  }

  // ── Password sign-in (alternative to OTP, set up post-verification) ────────
  const handlePasswordSignIn = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: email.trim().toLowerCase(),
        password,
      })
      if (result?.error) {
        setError("Incorrect email or password.")
        return
      }
      const sessionRes = await fetch("/api/auth/session")
      const sessionData = sessionRes.ok ? await sessionRes.json() : null
      const isAdmin = sessionData?.user?.role === "ADMIN"

      if (isAdmin) {
        router.push(callbackUrl.startsWith("/admin") ? callbackUrl : "/admin")
      } else {
        router.push(callbackUrl)
      }
    } finally {
      setLoading(false)
    }
  }, [email, password, callbackUrl, router])

  const [linkedinLoading, setLinkedinLoading] = useState(false)
  const handleLinkedInSignIn = useCallback(() => {
    setLinkedinLoading(true)
    signIn("linkedin", { callbackUrl })
  }, [callbackUrl])

  // ── ID card verification ────────────────────────────────────────────────────
  const [idFullName, setIdFullName]       = useState("")
  const [idCorpEmail, setIdCorpEmail]     = useState("")
  const [idPhone, setIdPhone]             = useState("")
  const [idDesignation, setIdDesignation] = useState("")
  const [idEmployeeId, setIdEmployeeId]   = useState("")
  const [idPassword, setIdPassword]       = useState("")
  const [idPasswordConfirm, setIdPasswordConfirm] = useState("")
  const [idFront, setIdFront] = useState<{ file: File; url: string } | null>(null)
  const [idBack, setIdBack]   = useState<{ file: File; url: string } | null>(null)
  const [idUploading, setIdUploading] = useState<"front" | "back" | null>(null)
  const [idSubmitting, setIdSubmitting] = useState(false)

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

  const handleIdSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!idFront || !idBack) { setError("Please upload both sides of your ID card."); return }
    if (idPassword.length < 8) { setError("Password must be at least 8 characters."); return }
    if (idPassword !== idPasswordConfirm) { setError("Passwords don't match."); return }
    setIdSubmitting(true)
    try {
      const res = await fetch("/api/id-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: idFullName.trim(),
          corpEmail: idCorpEmail.trim().toLowerCase(),
          phone: idPhone.trim(),
          designation: idDesignation.trim() || undefined,
          employeeId: idEmployeeId.trim() || undefined,
          frontImageUrl: idFront.url,
          backImageUrl: idBack.url,
          password: idPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Couldn't submit your request. Please try again."); return }
      setStep("idcard-submitted")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIdSubmitting(false)
    }
  }, [idFullName, idCorpEmail, idPhone, idDesignation, idEmployeeId, idFront, idBack, idPassword, idPasswordConfirm])

  const urlError = params.get("error")

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-6">
          <Image src="/logo.png" alt="Korpo" width={40} height={40} className="rounded-xl object-contain" />
          <span className="font-bold text-2xl text-primary-600">Korpo</span>
        </Link>
        {step === "signin" && (
          <>
            <h1 className="text-2xl font-bold">Sign in to Korpo</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Choose how you&apos;d like to sign in
            </p>
          </>
        )}
        {step === "register-choice" && (
          <>
            <h1 className="text-2xl font-bold">Register with Korpo</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Verify your corporate identity to get started
            </p>
          </>
        )}
        {step === "otp" && (
          <>
            <h1 className="text-2xl font-bold">{isNewUser ? "Verify your email" : "Enter your code"}</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
            </p>
          </>
        )}
        {step === "password" && (
          <>
            <h1 className="text-2xl font-bold">Sign in with password</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Only works if you've already set one up on a previous login
            </p>
          </>
        )}
        {step === "email-otp" && (
          <>
            <h1 className="text-2xl font-bold">Sign in with Corp email</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              We'll send a one-time code to your corporate email
            </p>
          </>
        )}
        {step === "idcard" && (
          <>
            <h1 className="text-2xl font-bold">Verify with Organization ID card</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Upload your ID card and details for admin review
            </p>
          </>
        )}
        {step === "idcard-submitted" && (
          <>
            <h1 className="text-2xl font-bold">Request submitted</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              An admin will review your ID card shortly
            </p>
          </>
        )}
        {step === "register" && (
          <>
            <h1 className="text-2xl font-bold">Create your Korpo account</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Name, corporate email, phone and a password — verified once by email
            </p>
          </>
        )}
        {step === "phone" && (
          <>
            <h1 className="text-2xl font-bold">Sign in with WhatsApp</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Enter the phone number you registered with
            </p>
          </>
        )}
        {step === "phone-otp" && (
          <>
            <h1 className="text-2xl font-bold">Enter your code</h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              We sent a 6-digit code on WhatsApp to <span className="font-medium text-foreground">{waPhone}</span>
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
              : urlError === "email_conflict"
              ? "That LinkedIn account's email is already linked to another Korpo account."
              : urlError === "linkedin_unverified"
              ? "Your LinkedIn email isn't verified yet. Please verify it on LinkedIn, then come back and sign in."
              : urlError === "CredentialsSignin"
              ? "That code is incorrect or has expired. Please request a new one."
              : "Something went wrong signing you in. Please try again."
          )}
          {urlError === "linkedin_unverified" && (
            <a
              href="https://www.linkedin.com/psettings/email"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-semibold underline underline-offset-2"
            >
              Verify your email on LinkedIn &rarr;
            </a>
          )}
        </div>
      )}

      {/* ── Register: choice menu ────────────────────────────────────────────── */}
      {step === "register-choice" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => { setError(""); setStep("register") }}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary-400 hover:shadow-sm transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Verify your Corp email</p>
              <p className="text-xs text-muted-foreground">One-time OTP sent to your work inbox</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => { setError(""); setStep("idcard") }}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary-400 hover:shadow-sm transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
              <IdCard className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Don&apos;t have a Corp email?</p>
              <p className="text-xs font-bold text-foreground">Register with your Organization ID card</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => { setError(""); setStep("signin") }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground font-medium transition-colors pt-1"
          >
            Already verified? Sign in
          </button>
        </div>
      )}

      {/* ── Sign in: verified users only ──────────────────────────────────────── */}
      {step === "signin" && (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => { setError(""); setStep("phone") }}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary-400 hover:shadow-sm transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-brand-green-50 dark:bg-brand-green-600/10 flex items-center justify-center shrink-0">
              <svg className="h-5 w-5 text-brand-green-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2.05 22l5.36-1.41a9.9 9.9 0 0 0 4.63 1.18h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm5.83 14.11c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.12.11-1.81-.11-.42-.13-.95-.31-1.64-.6-2.88-1.24-4.75-4.14-4.9-4.33-.14-.2-1.17-1.56-1.17-2.98 0-1.42.74-2.11 1-2.41.26-.3.57-.37.76-.37.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.57.81 1.98.88 2.12.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.45.12.61-.07.17-.19.71-.83.9-1.11.19-.29.38-.24.64-.14.26.1 1.65.78 1.94.92.28.14.47.21.54.33.07.12.07.68-.17 1.36z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">WhatsApp OTP</p>
              <p className="text-xs text-muted-foreground">Code sent to your registered number</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => { setError(""); setStep("password") }}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary-400 hover:shadow-sm transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-brand-yellow-50 dark:bg-brand-yellow-600/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="h-5 w-5 text-brand-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Password</p>
              <p className="text-xs text-muted-foreground">Sign in with your saved password</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            type="button"
            onClick={() => { setError(""); setRegistering(false); setStep("email-otp") }}
            className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary-400 hover:shadow-sm transition-all group"
          >
            <div className="h-10 w-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
              <Mail className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground">Corp email OTP</p>
              <p className="text-xs text-muted-foreground">Enter your email to get a one-time code</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {linkedinAvailable && (
            <button
              type="button"
              onClick={handleLinkedInSignIn}
              disabled={linkedinLoading}
              className="w-full flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:border-primary-400 hover:shadow-sm transition-all group disabled:opacity-60"
            >
              <div className="h-10 w-10 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center shrink-0">
                {linkedinLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#0A66C2]" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#0A66C2" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM7.114 20.452H3.558V9h3.556v11.452z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">Continue with LinkedIn</p>
                <p className="text-xs text-muted-foreground">Sign in using your LinkedIn account</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          <button
            type="button"
            onClick={() => { setError(""); setStep("register-choice") }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground font-medium transition-colors pt-1"
          >
            New here? Create an account
          </button>
        </div>
      )}

      {/* ── Password sign-in ─────────────────────────────────────────────────── */}
      {step === "password" && (
        <form onSubmit={handlePasswordSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pw-email">Corporate email</Label>
            <Input
              id="pw-email"
              type="email"
              autoComplete="email"
              placeholder="you@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pw-password">Password</Label>
            <Input
              id="pw-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || !email.includes("@") || !password}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Signing in…</> : "Sign in →"}
          </Button>

          <button
            type="button"
            onClick={() => { setStep("signin"); setPassword(""); setError("") }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </form>
      )}

      {/* ── Corp email OTP sign-in — direct email entry, no registration fields ─ */}
      {step === "email-otp" && (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email-otp-email">Corporate email</Label>
            <Input
              id="email-otp-email"
              type="email"
              autoComplete="email"
              placeholder="you@yourcompany.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || !email.includes("@")}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending code…</> : "Send code →"}
          </Button>

          <button
            type="button"
            onClick={() => { setStep("signin"); setError("") }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </form>
      )}

      {/* ── Step: Organization ID card verification ─────────────────────────── */}
      {step === "idcard" && (
        <form onSubmit={handleIdSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="id-fullname">Full name</Label>
            <Input id="id-fullname" value={idFullName} onChange={(e) => setIdFullName(e.target.value)} required autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="id-corp-email">Corporate email</Label>
            <Input id="id-corp-email" type="email" autoComplete="email" placeholder="you@yourcompany.com"
              value={idCorpEmail} onChange={(e) => setIdCorpEmail(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="id-phone">Phone number</Label>
            <Input id="id-phone" type="tel" placeholder="+91 98765 43210" value={idPhone} onChange={(e) => setIdPhone(e.target.value)} required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="id-designation">Designation (optional)</Label>
              <Input id="id-designation" value={idDesignation} onChange={(e) => setIdDesignation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="id-employee-id">Employee ID (optional)</Label>
              <Input id="id-employee-id" value={idEmployeeId} onChange={(e) => setIdEmployeeId(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="id-password">Set a password</Label>
              <Input id="id-password" type="password" autoComplete="new-password"
                value={idPassword} onChange={(e) => setIdPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="id-password-confirm">Confirm password</Label>
              <Input id="id-password-confirm" type="password" autoComplete="new-password"
                value={idPasswordConfirm} onChange={(e) => setIdPasswordConfirm(e.target.value)} required />
            </div>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            You'll be able to sign in with this password as soon as an admin approves your request.
          </p>

          {/* Front side upload */}
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

          {/* Back side upload */}
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

          <Button type="submit" className="w-full" size="lg" disabled={idSubmitting || idUploading !== null || !idFront || !idBack || !idPassword || !idPasswordConfirm}>
            {idSubmitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</> : "Submit for review →"}
          </Button>

          <button
            type="button"
            onClick={() => { setStep("register-choice"); setError("") }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </form>
      )}

      {/* ── Step: ID card request submitted ──────────────────────────────────── */}
      {step === "idcard-submitted" && (
        <div className="space-y-5 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <IdCard className="h-6 w-6 text-primary-600" />
          </div>
          <p className="text-sm text-muted-foreground">
            We've received your details for <span className="font-medium text-foreground">{idCorpEmail}</span>.
            Once an admin approves your request, sign in with this email and the password you just set.
          </p>
          <Button variant="outline" className="w-full" size="lg" onClick={() => setStep("signin")}>
            Back to sign in
          </Button>
        </div>
      )}

      {/* ── Step: Registration (Name/Corp email/Phone/Password) ─────────────── */}
      {step === "register" && (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-name">Full name</Label>
            <Input id="reg-name" value={regName} onChange={(e) => setRegName(e.target.value)} required autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Corporate email</Label>
            <Input id="reg-email" type="email" autoComplete="email" placeholder="you@yourcompany.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-phone">Phone number</Label>
            <Input id="reg-phone" type="tel" placeholder="+91 98765 43210"
              value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required />
            <p className="text-xs text-muted-foreground">Used to sign in with a WhatsApp OTP from your next login onward.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="reg-password">Set a password</Label>
              <Input id="reg-password" type="password" autoComplete="new-password"
                value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reg-password-confirm">Confirm password</Label>
              <Input id="reg-password-confirm" type="password" autoComplete="new-password"
                value={regPasswordConfirm} onChange={(e) => setRegPasswordConfirm(e.target.value)} required />
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg"
            disabled={loading || !regName || !email.includes("@") || !regPhone || !regPassword || !regPasswordConfirm}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending code…</> : "Verify email & create account →"}
          </Button>

          <button
            type="button"
            onClick={() => { setStep("register-choice"); setError("") }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </form>
      )}

      {/* ── Step: WhatsApp OTP sign-in — phone entry ─────────────────────────── */}
      {step === "phone" && (
        <form onSubmit={handleSendWhatsAppOTP} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="wa-phone">Phone number</Label>
            <Input id="wa-phone" type="tel" placeholder="+91 98765 43210"
              value={waPhone} onChange={(e) => setWaPhone(e.target.value)} required autoFocus />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading || !waPhone}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Sending code…</> : "Send WhatsApp code →"}
          </Button>

          <button
            type="button"
            onClick={() => { setStep("signin"); setError("") }}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </button>
        </form>
      )}

      {/* ── Step: WhatsApp OTP sign-in — code entry ──────────────────────────── */}
      {step === "phone-otp" && (
        <div className="space-y-5">
          <div>
            <Label className="block text-center mb-3">Enter the 6-digit code</Label>
            <div className="flex gap-2 justify-center">
              {waOtp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { waOtpRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleWaOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleWaOtpKeyDown(i, e)}
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
            disabled={loading || waOtp.join("").length !== 6}
            onClick={() => handleVerifyWhatsAppOTP()}
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Verifying…</> : "Verify & Sign in →"}
          </Button>

          <div className="flex items-center justify-between text-sm pt-1">
            <button
              type="button"
              onClick={() => { setStep("phone"); setWaOtp(["","","","","",""]); setError("") }}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Change number
            </button>
            {waResendIn > 0 ? (
              <span className="text-muted-foreground">Resend in {waResendIn}s</span>
            ) : (
              <button
                type="button"
                onClick={() => handleSendWhatsAppOTP()}
                disabled={loading}
                className="flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Resend code
              </button>
            )}
          </div>
        </div>
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
              onClick={() => { setStep(registering ? "register" : "email-otp"); setOtp(["","","","","",""]); setError("") }}
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
