"use client"
import { useRouter } from "next/navigation"
import type { KeyboardEvent, MouseEvent, ReactNode } from "react"
import { cn } from "@/lib/utils"

interface Props {
  userId?: string | null
  className?: string
  children: ReactNode
}

// Renders as a <span>, not an <a> — this lets it be safely nested inside a
// card/row that's already wrapped in its own <Link> (nesting an <a> inside
// an <a> is invalid HTML and breaks hydration), while still navigating to
// the user's profile and stopping the click from bubbling to the outer link.
export function ProfileLink({ userId, className, children }: Props) {
  const router = useRouter()

  if (!userId) return <>{children}</>

  const go = (e: MouseEvent | KeyboardEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/profile/${userId}`)
  }

  return (
    <span
      role="link"
      tabIndex={0}
      onClick={go}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") go(e) }}
      className={cn("cursor-pointer hover:underline", className)}
    >
      {children}
    </span>
  )
}
