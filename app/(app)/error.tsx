"use client"
import { useEffect } from "react"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="h-14 w-14 rounded-2xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
      </div>
      <h1 className="text-lg font-bold mb-1">Something went wrong</h1>
      <p className="text-sm text-muted-foreground mb-6">
        This page hit an unexpected error. Any details you'd entered on this form are safe — try again below.
      </p>
      <Button onClick={reset} className="gap-2">
        <RotateCcw className="h-4 w-4" /> Try again
      </Button>
    </div>
  )
}
