"use client"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Building2, ArrowRight, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function CorpEmailPage() {
  const { update } = useSession()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify-corp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      let data: { error?: string } = {}
      try {
        data = await res.json()
      } catch {
        // Non-JSON response (e.g. a 500 HTML error page) — fall through to the generic message below.
      }
      if (!res.ok) { setError(data.error ?? "Couldn't validate that email. Please try again."); return }
      await update()
      router.push("/dashboard")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">One more step</h1>
          <p className="text-sm text-muted-foreground">Tell us your corporate email</p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        We use this to match you with your company on Korpo. It's validated instantly in the background — nothing is sent to it.
      </p>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="corp-email">Corporate email</Label>
          <Input
            id="corp-email"
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
          {loading ? "Validating…" : "Continue"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>

      <div className="mt-6 flex items-start gap-3 bg-surface rounded-xl p-4 border border-border">
        <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-0.5">No email or OTP will be sent</p>
          <p>We check that the domain and mailbox are real using mail-server records — we never deliver anything to this address to verify it.</p>
        </div>
      </div>
    </div>
  )
}
