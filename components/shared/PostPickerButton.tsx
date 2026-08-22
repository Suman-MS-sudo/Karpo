"use client"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ServiceGrid } from "@/components/shared/ServiceGrid"
import type { ServiceConfig } from "@/config/services"
import { cn } from "@/lib/utils"

/**
 * Wraps a "Post" trigger and opens a service picker instead of hardcoding a
 * single destination (e.g. always /marketplace/new) — same picker UX as the
 * TopNav's Quick Post button.
 */
export function PostPickerButton({
  children,
  panelClassName,
}: {
  children: React.ReactNode
  panelClassName?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  const handleSelect = (service: ServiceConfig) => {
    setOpen(false)
    router.push(`${service.route}/new`)
  }

  return (
    <div className="relative inline-block" ref={ref}>
      {/* children is plain, server-renderable JSX (not a render-prop function —
          Server Components can't pass functions across the RSC boundary to a
          client component). This div's own onClick handles opening the panel
          regardless of what's inside. */}
      <div onClick={() => setOpen((o) => !o)}>{children}</div>
      {open && (
        <div className={cn("absolute z-50 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl p-4", panelClassName)}>
          <p className="text-sm font-semibold mb-3">What would you like to post?</p>
          <ServiceGrid variant="picker" onSelect={handleSelect} />
        </div>
      )}
    </div>
  )
}
