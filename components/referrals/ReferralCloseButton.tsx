"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ReferralCloseButton({ referralId, isClosed }: { referralId: string; isClosed: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function toggle() {
    setLoading(true); setError("")
    try {
      const res = await fetch(`/api/referrals/${referralId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ status: isClosed ? "OPEN" : "CLOSED" }),
      })
      let data: any = null
      try { data = await res.json() } catch { /* non-JSON error page */ }
      if (!res.ok) {
        setError(data?.error ?? `Something went wrong (${res.status}). Please try again.`)
        return
      }
      router.refresh()
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contents">
      <Button
        variant="outline" size="sm"
        className="text-xs h-8 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50"
        disabled={loading}
        onClick={toggle}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isClosed ? "Reopen" : "Close"}
      </Button>
      {error && <p className="col-span-2 text-xs text-red-500">{error}</p>}
    </div>
  )
}
