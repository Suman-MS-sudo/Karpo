"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MarkSoldButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState("")

  async function handleMarkSold() {
    if (!confirm("Mark this listing as sold? You can't undo this.")) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/listings/${listingId}/close`, { method: "POST" })
      if (res.ok || res.redirected) {
        toast.success("Listing marked as sold!")
        router.push("/marketplace")
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Something went wrong")
        toast.error(data.error ?? "Something went wrong")
      }
    } catch {
      setError("Network error, please try again")
      toast.error("Network error — please try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        disabled={loading}
        onClick={handleMarkSold}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : "✅ "}
        Mark Sold
      </Button>
      {error && <p className="text-xs text-red-500 mt-1 text-center">{error}</p>}
    </div>
  )
}
