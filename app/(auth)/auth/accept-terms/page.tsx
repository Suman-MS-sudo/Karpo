"use client"
import { useState } from "react"
import Link from "next/link"
import { ScrollText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LegalModal } from "@/components/legal/LegalModal"
import { TERMS_VERSION } from "@/lib/legal-versions"

// Shown by the (app) layout to any signed-in user who hasn't accepted the
// current TERMS_VERSION — new LinkedIn/ID-card sign-ups, existing accounts
// from before acceptance was recorded, and everyone after a material update.
export default function AcceptTermsPage() {
  const [agreed, setAgreed]   = useState(false)
  const [listing, setListing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  const accept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!agreed || !listing) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/user/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: TERMS_VERSION, agreed: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error ?? "Something went wrong. Please try again."); return }
      // Full reload so the (app) layout re-reads the acceptance.
      window.location.href = "/dashboard"
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
          <ScrollText className="h-5 w-5 text-primary-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Before you continue</h1>
          <p className="text-sm text-muted-foreground">Please review and accept our terms</p>
        </div>
      </div>

      <div className="text-sm text-muted-foreground space-y-3 mb-6">
        <p>
          Korpo is an intermediary platform: it helps members discover and contact each other, but it is not a
          party to any sale, rental, referral, freelance job, ride or event arranged here.
        </p>
        <p>
          &quot;Corporate email verified&quot; only means a member could receive a code at a corporate email
          address. Korpo does not verify identity, employment, or any listing, product, property, job, service,
          ride or transaction — please do your own checks.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={accept} className="space-y-4">
        <label className="flex items-start gap-2.5 text-sm cursor-pointer">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
          <span>
            I am 18 or older and agree to Korpo&apos;s{" "}
            <LegalModal doc="terms"><button type="button" className="underline hover:text-foreground">Terms and Conditions</button></LegalModal>{" "}
            and{" "}
            <LegalModal doc="privacy"><button type="button" className="underline hover:text-foreground">Privacy Policy</button></LegalModal>.
          </span>
        </label>
        <label className="flex items-start gap-2.5 text-sm cursor-pointer">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-primary" checked={listing} onChange={(e) => setListing(e.target.checked)} />
          <span>
            I will follow the{" "}
            <Link href="/prohibited-content" target="_blank" className="underline hover:text-foreground">Prohibited Content Policy</Link>{" "}
            and post only accurate information that I am authorised to share — and never my employer&apos;s
            confidential information or property.
          </span>
        </label>

        <Button type="submit" className="w-full" size="lg" disabled={loading || !agreed || !listing}>
          {loading ? "Saving…" : "Accept and continue"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  )
}
