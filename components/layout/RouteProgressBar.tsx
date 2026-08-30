"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

// Slim top-of-page progress bar shown between clicking a nav link and the
// new route's content actually arriving. Module pages fetch real data on
// the server (see dashboard/marketplace/admin — several DB round trips
// each), so a click can go 200ms-plus with zero visual feedback otherwise;
// this closes that gap the same way GitHub/YouTube's nav bar does, without
// pulling in an nprogress dependency.
export function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <RouteProgressBarInner />
    </Suspense>
  )
}

function RouteProgressBarInner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const isFirstRender = useRef(true)

  const clearTimers = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }

  // Any in-app link click starts the bar immediately — before Next.js has
  // even begun fetching the destination, so the click itself feels instant.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement)?.closest("a")
      if (!anchor) return
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
      const href = anchor.getAttribute("href")
      if (!href || !href.startsWith("/") || href.startsWith("//")) return
      if (anchor.target && anchor.target !== "_self") return
      if (href === pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "")) return

      clearTimers()
      setVisible(true)
      setProgress(15)
      timers.current.push(setTimeout(() => setProgress(45), 100))
      timers.current.push(setTimeout(() => setProgress(70), 400))
      // Slow trickle if the destination is taking a while, so the bar never
      // looks stuck at one spot on a genuinely slow page.
      timers.current.push(setTimeout(() => setProgress(85), 1200))
    }
    document.addEventListener("click", onClick)
    return () => document.removeEventListener("click", onClick)
  }, [pathname, searchParams])

  // Pathname/search params changing means the new route has committed —
  // finish the bar out and fade it away.
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (!visible) return
    clearTimers()
    setProgress(100)
    timers.current.push(setTimeout(() => setVisible(false), 200))
    timers.current.push(setTimeout(() => setProgress(0), 400))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams])

  useEffect(() => () => clearTimers(), [])

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[100] h-[3px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-accent to-primary bg-[length:200%_auto]"
        style={{
          width: `${progress}%`,
          transition: progress === 0 ? "none" : "width 300ms ease-out",
          boxShadow: visible ? "0 0 8px rgba(0,0,0,0.25)" : "none",
        }}
      />
    </div>
  )
}
