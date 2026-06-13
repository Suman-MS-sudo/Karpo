"use client"
import { useState, useEffect } from "react"

interface Notification {
  id: string
  title: string
  body: string
  isRead: boolean
  link?: string | null
  createdAt: string
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetch("/api/notifications?limit=20")
      .then((r) => r.json())
      .then((d) => {
        const notifs = d.data ?? []
        setNotifications(notifs)
        setUnreadCount(notifs.filter((n: Notification) => !n.isRead).length)
      })
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "POST" })
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  return { notifications, unreadCount, markAllRead }
}
