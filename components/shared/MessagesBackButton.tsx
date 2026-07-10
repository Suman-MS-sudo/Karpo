"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export function MessagesBackButton() {
  const router = useRouter()
  const [canGoBack, setCanGoBack] = useState(false)

  useEffect(() => {
    setCanGoBack(window.history.length > 1)
  }, [])

  const handleBack = () => {
    if (canGoBack) router.back()
    else router.push("/dashboard")
  }

  return (
    <button
      onClick={handleBack}
      title="Go back"
      className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  )
}
