"use client"
import { useEffect, useRef, useState } from "react"
import { X, Minus, Send, Loader2, CheckCheck } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials, formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { useChatContext, type ChatWindow as ChatWindowType } from "./ChatContext"
import { useSession } from "next-auth/react"
import Link from "next/link"

interface Props {
  win: ChatWindowType
  offsetRight: number
}

export function ChatWindow({ win, offsetRight }: Props) {
  const { data: session } = useSession()
  const { closeChat, toggleMinimize, sendMessage, markRead } = useChatContext()
  const [input, setInput]   = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)
  const windowRef  = useRef<HTMLDivElement>(null)

  // Auto-scroll to latest message when expanded
  useEffect(() => {
    if (!win.isMinimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [win.messages, win.isMinimized])

  // Mark as read when expanded
  useEffect(() => {
    if (!win.isMinimized && win.unreadCount > 0) {
      markRead(win.partner.id)
    }
  }, [win.isMinimized, win.unreadCount, win.partner.id, markRead])

  // Focus input when expanded
  useEffect(() => {
    if (!win.isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [win.isMinimized])

  // ── Click-outside → minimize ──────────────────────────────────────────────
  useEffect(() => {
    if (win.isMinimized) return // nothing to do when already minimized

    function onPointerDown(e: PointerEvent) {
      if (windowRef.current && !windowRef.current.contains(e.target as Node)) {
        toggleMinimize(win.partner.id)
      }
    }

    // Delay slightly so the click that *opened* the window doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener("pointerdown", onPointerDown)
    }, 200)

    return () => {
      clearTimeout(timer)
      document.removeEventListener("pointerdown", onPointerDown)
    }
  }, [win.isMinimized, win.partner.id, toggleMinimize])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setInput("")
    setSending(true)
    try {
      await sendMessage(win.partner.id, text)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      ref={windowRef}
      className="fixed bottom-0 z-[60] flex flex-col shadow-2xl rounded-t-2xl overflow-hidden border border-border bg-card"
      style={{
        width: 320,
        right: offsetRight,
        transition: "right 0.2s ease",
        // Keep the full window within the viewport vertically
        maxHeight: "calc(100dvh - 56px)", // 56px = TopNav height
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 bg-primary-700 dark:bg-primary-900 text-white cursor-pointer select-none shrink-0"
        onClick={() => toggleMinimize(win.partner.id)}
      >
        <div className="relative shrink-0">
          <Avatar className="h-8 w-8 ring-2 ring-white/30">
            <AvatarImage src={win.partner.avatarUrl ?? ""} />
            <AvatarFallback className="text-xs bg-primary-500 text-white">
              {getInitials(win.partner.name)}
            </AvatarFallback>
          </Avatar>
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-primary-700 dark:border-primary-900" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate leading-tight">{win.partner.name}</p>
          {win.partner.jobTitle && (
            <p className="text-[10px] text-white/60 truncate leading-tight">{win.partner.jobTitle}</p>
          )}
        </div>

        {win.isMinimized && win.unreadCount > 0 && (
          <span className="h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {win.unreadCount > 9 ? "9+" : win.unreadCount}
          </span>
        )}

        <div className="flex items-center gap-1 ml-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleMinimize(win.partner.id) }}
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            title={win.isMinimized ? "Expand" : "Minimize"}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); closeChat(win.partner.id) }}
            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Body (hidden when minimized) ──────────────────────────────────── */}
      {!win.isMinimized && (
        <>
          {/* Messages — scrollable, fills available height between header and input */}
          <div
            className="bg-card overflow-y-auto p-3 space-y-2"
            style={{
              // Shrink on small screens: header ≈ 52px, input ≈ 52px, TopNav = 56px → 160px total chrome
              minHeight: 120,
              maxHeight: "calc(100dvh - 56px - 52px - 52px)",
            }}
          >
            {win.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : win.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-center">
                <p className="text-muted-foreground text-xs">No messages yet.</p>
                <p className="text-muted-foreground text-[10px]">Say hello! 👋</p>
              </div>
            ) : (
              <>
                <div className="text-center pb-1">
                  <Link
                    href={`/messages/${win.partner.id}`}
                    className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                  >
                    View full conversation →
                  </Link>
                </div>

                {win.messages.map((msg) => {
                  const isMine = msg.senderId === session?.user?.id
                  return (
                    <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      {!isMine && (
                        <Avatar className="h-6 w-6 mr-1.5 mt-auto shrink-0">
                          <AvatarImage src={win.partner.avatarUrl ?? ""} />
                          <AvatarFallback className="text-[9px]">
                            {getInitials(win.partner.name)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className="max-w-[72%]">
                        <div
                          className={cn(
                            "px-3 py-1.5 rounded-2xl text-sm leading-snug break-words",
                            isMine
                              ? "bg-primary-600 text-white rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm",
                            msg.pending && "opacity-60"
                          )}
                        >
                          {msg.content}
                        </div>
                        <div className={cn("flex items-center gap-1 mt-0.5", isMine ? "justify-end" : "justify-start")}>
                          <p className="text-[9px] text-muted-foreground">
                            {formatRelativeTime(msg.createdAt)}
                          </p>
                          {isMine && !msg.pending && (
                            <CheckCheck className={cn("h-3 w-3", msg.isRead ? "text-blue-400" : "text-muted-foreground")} />
                          )}
                          {isMine && msg.pending && (
                            <Loader2 className="h-2.5 w-2.5 animate-spin text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="bg-card border-t border-border p-2 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Aa"
              className="flex-1 h-9 px-3 rounded-full bg-muted text-sm outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSend(e as unknown as React.FormEvent)
                }
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className={cn(
                "h-9 w-9 rounded-full flex items-center justify-center transition-colors shrink-0",
                input.trim()
                  ? "bg-primary-600 hover:bg-primary-700 text-white"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {sending
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
