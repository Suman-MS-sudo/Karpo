"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShieldCheck, ShieldOff, Crown, Loader2 } from "lucide-react"

interface Props {
  userId: string
  isVerified: boolean
  role: string
  currentAdminId: string
}

export function UserActions({ userId, isVerified, role, currentAdminId }: Props) {
  const [verified, setVerified]   = useState(isVerified)
  const [userRole, setUserRole]   = useState(role)
  const [loading, setLoading]     = useState<string | null>(null)

  const isSelf = userId === currentAdminId

  async function patch(body: object, optimistic: () => void) {
    const key = JSON.stringify(body)
    setLoading(key)
    optimistic()
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? "Action failed")
        // revert
        setVerified(isVerified)
        setUserRole(role)
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        disabled={!!loading}
        onClick={() => patch({ isVerified: !verified }, () => setVerified((v) => !v))}
      >
        {loading === JSON.stringify({ isVerified: !verified })
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : verified
            ? <><ShieldOff className="h-3 w-3 mr-1" />Unverify</>
            : <><ShieldCheck className="h-3 w-3 mr-1" />Verify</>
        }
      </Button>

      {!isSelf && (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={!!loading}
          onClick={() => patch(
            { role: userRole === "ADMIN" ? "USER" : "ADMIN" },
            () => setUserRole((r) => r === "ADMIN" ? "USER" : "ADMIN")
          )}
        >
          {loading === JSON.stringify({ role: userRole === "ADMIN" ? "USER" : "ADMIN" })
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : userRole === "ADMIN"
              ? "Demote"
              : <><Crown className="h-3 w-3 mr-1" />Make Admin</>
          }
        </Button>
      )}
    </div>
  )
}
