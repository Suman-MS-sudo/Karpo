"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { usePathname } from "next/navigation"

export function MessageIcon() {
  const [unread, setUnread] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    fetch("/api/messages/unread-count")
      .then((r) => r.json())
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => {})
  }, [pathname])

  return (
    <Link
      href="/messages"
      className="relative h-9 w-9 flex items-center justify-center rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
    >
      <MessageSquare className="h-[18px] w-[18px]" />
      {unread > 0 && (
        <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  )
}
