"use client"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { KeyRound, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function skipForNow(router: ReturnType<typeof useRouter>) {
  document.cookie = `skip_password_setup=1; path=/; max-age=${60 * 60 * 24 * 7}`
  router.push("/dashboard")
}

function SetPasswordContent() {
  const router = useRouter()
  const params = useSearchParams()

  // Present only for ID-card-approval links, where the user has no session yet
  // (see /api/admin/id-verifications/[id]/approve) — everyone else (OTP/LinkedIn)
  // is already authenticated when they land here.
  const email = params.get("email")
  const token = params.get("token")
  const isTokenFlow = Boolean(email && token)

  const [password, setPassword]   = useState("")
  const [confirm, setConfirm]     = useState("")
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState("")
  const [done, setDone]           = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (password !== confirm) { setError("Passwords don't match."); return }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isTokenFlow ? { password, email, token } : { password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "Couldn't set your password. Please try again."); return }
      if (isTokenFlow) {
        setDone(true)
      } else {
        router.push("/dashboard")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 text-center space-y-5">
        <div className="mx-auto h-12 w-12 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <KeyRound className="h-6 w-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Password set</h1>
          <p className="text-sm text-muted-foreground mt-1.5">You can now sign in with your corporate email and password.</p>
        </div>
        <Button className="w-full" size="lg" onClick={() => router.push("/auth/signin")}>
          Go to sign in
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
          <KeyRound className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Set up a password</h1>
          <p className="text-sm text-muted-foreground">
            {isTokenFlow ? `For ${email}` : "Skip OTP/LinkedIn next time"}
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        {isTokenFlow
          ? "Your organization ID card verification was approved. Set a password to sign in."
          : "You're verified — set a password now so you can sign in directly next time instead of repeating verification."}
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={loading || !password || !confirm}>
          {loading ? "Saving…" : "Set password"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>

        {!isTokenFlow && (
          <button
            type="button"
            onClick={() => skipForNow(router)}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        )}
      </form>

      <div className="mt-6 flex items-start gap-3 bg-surface rounded-xl p-4 border border-border">
        <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-0.5">
            {isTokenFlow ? "One-time link" : "Optional, but recommended"}
          </p>
          <p>
            {isTokenFlow
              ? "This link only works once and expires in 24 hours."
              : "You can always fall back to OTP or LinkedIn sign-in — a password is just a faster path."}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordContent />
    </Suspense>
  )
}
