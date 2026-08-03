"use client"
import { useEffect, useState, useCallback } from "react"

export function useOpenConcernsCount(enabled = true) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    if (!enabled) return
    fetch("/api/admin/concerns/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setCount(d.count) })
      .catch(() => {})
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    refresh()
    const id = setInterval(refresh, 60_000)
    return () => clearInterval(id)
  }, [refresh, enabled])

  return enabled ? count : 0
}
