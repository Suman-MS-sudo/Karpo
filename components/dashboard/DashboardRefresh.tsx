"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * The dashboard's live counts (e.g. "Services in <city>") are server-rendered
 * (page.tsx is force-dynamic), but Next's client Router Cache can still serve
 * a stale in-memory copy when navigating back here. Force one refresh per
 * mount so counts stay current without disabling the router cache app-wide.
 */
export function DashboardRefresh() {
  const router = useRouter()

  useEffect(() => {
    router.refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
