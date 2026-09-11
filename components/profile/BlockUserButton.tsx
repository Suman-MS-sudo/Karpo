"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShieldOff, ShieldCheck, X, Loader2, MessageSquareOff, UserX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  userId: string
  userName: string | null
  initialIsBlocked: boolean
  initialScope: "MESSAGE" | "FULL" | null
}

export function BlockUserButton({ userId, userName, initialIsBlocked, initialScope }: Props) {
  const router = useRouter()
  const [isBlocked, setIsBlocked] = useState(initialIsBlocked)
  const [scope, setScope] = useState(initialScope)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const name = userName ?? "this user"

  const block = async (chosenScope: "MESSAGE" | "FULL") => {
    setLoading(true)
    try {
      await fetch(`/api/users/${userId}/block`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ scope: chosenScope }),
      })
      setIsBlocked(true)
      setScope(chosenScope)
      setOpen(false)
      if (chosenScope === "FULL") router.push("/dashboard")
      else router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const unblock = async () => {
    setLoading(true)
    try {
      await fetch(`/api/users/${userId}/block`, { method: "DELETE" })
      setIsBlocked(false)
      setScope(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (isBlocked) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-9 px-0 sm:w-auto sm:px-3 gap-1.5"
        onClick={unblock}
        disabled={loading}
        title={`Unblock${scope === "FULL" ? "" : " messages"}`}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">Unblock{scope === "FULL" ? "" : " messages"}</span>
      </Button>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="w-9 px-0 sm:w-auto sm:px-3 gap-1.5"
        onClick={() => setOpen(true)}
        title="Block"
      >
        <ShieldOff className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Block</span>
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold">Block {name}?</h3>
              <button
                onClick={() => setOpen(false)}
                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">Choose how much you want to block.</p>

            <div className="space-y-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => block("MESSAGE")}
                className="w-full flex items-start gap-3 rounded-xl border border-border p-3.5 text-left hover:border-primary-400 hover:bg-muted/40 transition-colors disabled:opacity-60"
              >
                <MessageSquareOff className="h-4.5 w-4.5 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Block messages only</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You can still see each other&apos;s profile and listings, but neither of you can message the other.
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => block("FULL")}
                className="w-full flex items-start gap-3 rounded-xl border border-border p-3.5 text-left hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-60"
              >
                <UserX className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Block completely</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Also hides your profile from each other, on top of blocking messages.
                  </p>
                </div>
              </button>
            </div>

            {loading && (
              <div className="flex justify-center mt-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
