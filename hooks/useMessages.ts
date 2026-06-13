"use client"
import { useState, useEffect, useCallback } from "react"

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
}

export function useMessages(partnerId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/messages/${partnerId}`)
    const data = await res.json()
    setMessages(data.messages ?? [])
    setLoading(false)
  }, [partnerId])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 5000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  const sendMessage = async (content: string) => {
    const res = await fetch(`/api/messages/${partnerId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })
    const msg = await res.json()
    setMessages((prev) => [...prev, msg])
    return msg
  }

  return { messages, loading, sendMessage, refetch: fetchMessages }
}
