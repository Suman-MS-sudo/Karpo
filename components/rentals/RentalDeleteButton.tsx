"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props { rentalId: string }

export function RentalDeleteButton({ rentalId }: Props) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting,   setDeleting]   = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/rentals/${rentalId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Rental listing deleted")
        router.push("/my-postings?tab=rentals")
      } else {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error ?? "Delete failed")
        setDeleting(false)
        setConfirming(false)
      }
    } catch {
      toast.error("Delete failed — check your connection")
      setDeleting(false)
      setConfirming(false)
    }
  }

  if (!confirming) {
    return (
      <Button variant="outline" size="sm"
        className="gap-1.5 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-400"
        onClick={() => setConfirming(true)}>
        <Trash2 className="h-3.5 w-3.5" />
        Delete
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0" />
      <span className="text-xs text-red-700 dark:text-red-300 font-medium">Delete this listing?</span>
      <Button size="sm" variant="destructive" className="h-7 px-3 text-xs ml-1"
        onClick={handleDelete} disabled={deleting}>
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, delete"}
      </Button>
      <button type="button" onClick={() => setConfirming(false)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors">
        Cancel
      </button>
    </div>
  )
}
