"use client"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { useSession } from "next-auth/react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string
  senderId: string
  receiverId: string
  content: string
  createdAt: string
  isRead: boolean
  /** Local-only: marks an optimistic message not yet confirmed by the server */
  pending?: boolean
}

export interface ChatPartner {
  id: string
  name: string
  avatarUrl?: string
  isVerified?: boolean
  jobTitle?: string
}

export interface ChatWindow {
  partner: ChatPartner
  messages: ChatMessage[]
  isMinimized: boolean
  isLoading: boolean
  unreadCount: number
}

interface ChatContextValue {
  windows: ChatWindow[]
  totalUnread: number
  openChat: (partner: ChatPartner) => void
  closeChat: (partnerId: string) => void
  toggleMinimize: (partnerId: string) => void
  sendMessage: (partnerId: string, content: string) => Promise<void>
  markRead: (partnerId: string) => void
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ChatContext = createContext<ChatContextValue | null>(null)

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider")
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const [windows, setWindows] = useState<ChatWindow[]>([])
  const sseRef = useRef<EventSource | null>(null)

  // ── SSE connection ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return

    let es: EventSource
    let reconnectTimer: ReturnType<typeof setTimeout>

    function connect() {
      es = new EventSource("/api/messages/stream")
      sseRef.current = es

      es.onmessage = (event) => {
        try {
          const msg: ChatMessage = JSON.parse(event.data)
          // Only handle messages sent TO the current user
          if (msg.receiverId !== session!.user!.id) return

          setWindows((prev) => {
            const idx = prev.findIndex((w) => w.partner.id === msg.senderId)
            if (idx === -1) {
              // Partner window not open → just bump unread via the global count
              // (handled below)
              return prev
            }
            const win = prev[idx]
            const updated: ChatWindow = {
              ...win,
              messages: [...win.messages.filter((m) => m.id !== msg.id), msg],
              unreadCount: win.isMinimized ? win.unreadCount + 1 : win.unreadCount,
            }
            const next = [...prev]
            next[idx] = updated
            return next
          })
        } catch {
          // ignore parse errors
        }
      }

      es.onerror = () => {
        es.close()
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      es?.close()
      clearTimeout(reconnectTimer)
    }
  }, [session?.user?.id])

  // ── Load messages for a conversation ───────────────────────────────────────
  const loadMessages = useCallback(async (partnerId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.partner.id === partnerId ? { ...w, isLoading: true } : w
      )
    )
    try {
      const res = await fetch(`/api/messages/${partnerId}`)
      const data = await res.json()
      setWindows((prev) =>
        prev.map((w) =>
          w.partner.id === partnerId
            ? { ...w, messages: data.messages ?? [], isLoading: false, unreadCount: 0 }
            : w
        )
      )
    } catch {
      setWindows((prev) =>
        prev.map((w) =>
          w.partner.id === partnerId ? { ...w, isLoading: false } : w
        )
      )
    }
  }, [])

  // ── Open / focus a conversation ────────────────────────────────────────────
  const openChat = useCallback(
    (partner: ChatPartner) => {
      setWindows((prev) => {
        const existing = prev.find((w) => w.partner.id === partner.id)
        if (existing) {
          // Un-minimize if minimized
          return prev.map((w) =>
            w.partner.id === partner.id
              ? { ...w, isMinimized: false, unreadCount: 0 }
              : w
          )
        }
        // Cap at 3 visible windows — close the oldest if needed
        const trimmed = prev.length >= 3 ? prev.slice(1) : prev
        return [
          ...trimmed,
          {
            partner,
            messages: [],
            isMinimized: false,
            isLoading: true,
            unreadCount: 0,
          },
        ]
      })
      // Fetch message history after state update
      setTimeout(() => loadMessages(partner.id), 0)
    },
    [loadMessages]
  )

  const closeChat = useCallback((partnerId: string) => {
    setWindows((prev) => prev.filter((w) => w.partner.id !== partnerId))
  }, [])

  const toggleMinimize = useCallback((partnerId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.partner.id === partnerId
          ? { ...w, isMinimized: !w.isMinimized, unreadCount: w.isMinimized ? 0 : w.unreadCount }
          : w
      )
    )
  }, [])

  const markRead = useCallback((partnerId: string) => {
    setWindows((prev) =>
      prev.map((w) =>
        w.partner.id === partnerId ? { ...w, unreadCount: 0 } : w
      )
    )
  }, [])

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (partnerId: string, content: string) => {
      if (!session?.user?.id) return
      const tempId = `temp-${Date.now()}`
      const tempMsg: ChatMessage = {
        id:         tempId,
        senderId:   session.user.id,
        receiverId: partnerId,
        content,
        createdAt:  new Date().toISOString(),
        isRead:     false,
        pending:    true,
      }

      // Optimistic insert
      setWindows((prev) =>
        prev.map((w) =>
          w.partner.id === partnerId
            ? { ...w, messages: [...w.messages, tempMsg] }
            : w
        )
      )

      try {
        const res = await fetch(`/api/messages/${partnerId}`, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ content }),
        })
        const saved: ChatMessage = await res.json()
        // Replace temp with real message
        setWindows((prev) =>
          prev.map((w) =>
            w.partner.id === partnerId
              ? {
                  ...w,
                  messages: w.messages.map((m) =>
                    m.id === tempId ? { ...saved, pending: false } : m
                  ),
                }
              : w
          )
        )
      } catch {
        // Remove optimistic message on failure
        setWindows((prev) =>
          prev.map((w) =>
            w.partner.id === partnerId
              ? { ...w, messages: w.messages.filter((m) => m.id !== tempId) }
              : w
          )
        )
      }
    },
    [session?.user?.id]
  )

  const totalUnread = windows.reduce((sum, w) => sum + w.unreadCount, 0)

  return (
    <ChatContext.Provider
      value={{ windows, totalUnread, openChat, closeChat, toggleMinimize, sendMessage, markRead }}
    >
      {children}
    </ChatContext.Provider>
  )
}
