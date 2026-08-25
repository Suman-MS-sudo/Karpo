"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { VerifiedBadge } from "@/components/shared/VerifiedBadge"
import { formatRelativeTime, getInitials } from "@/lib/utils"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  senderId: string
  content: string
  createdAt: string
}

interface Partner {
  id: string
  name: string | null
  image: string | null
  avatarUrl: string | null
  isVerified: boolean
  jobTitle: string | null
}

export default function MessageThreadPage() {
  const { data: session } = useSession()
  const router      = useRouter()
  const params      = useParams()
  const searchParams = useSearchParams()
  const partnerId   = params.userId as string

  // Context params let us build a smarter fallback for the back button
  const contextListingId = searchParams.get("context")
  const contextType      = searchParams.get("type")

  const [messages, setMessages] = useState<Message[]>([])
  const [partner,  setPartner]  = useState<Partner | null>(null)
  const [input,    setInput]    = useState("")
  const [sending,  setSending]  = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  // Detect whether the browser has history to go back to
  useEffect(() => {
    setCanGoBack(window.history.length > 1)
  }, [])

  // ── Mobile keyboard handling ────────────────────────────────────────────
  // On mobile this page renders as a `fixed inset-0` overlay (see the root
  // div below) so it's completely independent of AppShell's scrollable
  // <main> — that's what stops the browser's "scroll the focused input into
  // view" behavior from dragging the header/messages off-screen when the
  // keyboard opens.
  //
  // `position: fixed` pins to the LAYOUT viewport, not the VISUAL one — on
  // iOS Safari in particular, opening the keyboard can shift the layout
  // viewport's scroll position without visualViewport.height changing by the
  // same amount (most noticeable the *second* time the keyboard opens, once
  // the page has already been scrolled once). Tracking only `height` left
  // the container's top edge pinned to a layout position that no longer
  // matched what was actually visible, so it (and the header/messages inside
  // it) drifted upward off-screen again. Tracking `offsetTop` too and
  // applying it as the container's `top` keeps it pinned to the visual
  // viewport exactly, however it's shifted, every time.
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    // Only drive position off visualViewport below the lg breakpoint — on
    // desktop the page is back to a normal in-flow panel (see the `lg:`
    // classes below) and must NOT have inline top/height fighting them.
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setViewport(mq.matches ? null : { height: vv.height, top: vv.offsetTop })
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    mq.addEventListener("change", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
      mq.removeEventListener("change", update)
    }
  }, [])

  // Belt-and-braces: also stop the document itself from scrolling while this
  // full-screen overlay is mounted. It shouldn't need to (the overlay is
  // `fixed` and its own message list scrolls internally), but if anything
  // ever does trigger a document scroll behind it (e.g. a focus-scroll that
  // escapes the fixed container), a scrolled document is exactly what
  // desyncs the layout viewport from the visual one on iOS and reproduces
  // this bug — so just make that scroll impossible.
  useEffect(() => {
    const { style } = document.body
    const prevOverflow = style.overflow
    const prevPosition = style.position
    style.overflow = "hidden"
    style.position = "fixed"
    return () => {
      style.overflow = prevOverflow
      style.position = prevPosition
    }
  }, [])

  useEffect(() => {
    fetch(`/api/profile/${partnerId}`).then((r) => r.json()).then((d) => setPartner(d))

    const fetchMessages = () =>
      fetch(`/api/messages/${partnerId}`).then((r) => r.json()).then((d) => setMessages(d.messages ?? []))

    fetchMessages()
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchMessages, 10_000)

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [partnerId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Smart back: prefer browser history, fall back to context-aware href
  const handleBack = () => {
    if (canGoBack) {
      router.back()
    } else if (contextListingId && contextType === "listing") {
      router.push(`/marketplace/${contextListingId}`)
    } else {
      router.push("/messages")
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput("")
    const tempMsg: Message = { id: "temp-" + Date.now(), senderId: session!.user!.id, content, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, tempMsg])
    try {
      const res  = await fetch(`/api/messages/${partnerId}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ content }),
      })
      const data = await res.json()
      setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? data : m))
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id))
      setInput(content)
    } finally {
      setSending(false)
    }
  }

  return (
    // Mobile: a `fixed inset-0` overlay, position + height pinned to
    // visualViewport (see the effect above) — deliberately taken OUT of
    // AppShell's scrollable <main> and above the fixed MobileNav (z-[60]),
    // so the browser's "scroll focused input into view" behavior has no
    // scrollable ancestor to act on and can't drag the header/messages
    // off-screen when the keyboard opens.
    // Desktop (lg): back to a normal in-flow panel inside <main>, no keyboard
    // to account for.
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background lg:static lg:z-auto lg:h-[calc(100svh-4rem)]"
      style={viewport != null ? { top: viewport.top, height: viewport.height } : undefined}
    >
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={handleBack}
          className="text-muted-foreground hover:text-foreground transition-colors p-0.5 -ml-0.5 rounded-lg hover:bg-muted"
          title="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        {partner && (
          <>
            <Avatar className="h-9 w-9">
              <AvatarImage src={partner.avatarUrl ?? partner.image ?? ""} />
              <AvatarFallback>{getInitials(partner.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/profile/${partner.id}`} className="font-medium hover:underline">
                  {partner.name}
                </Link>
                {partner.isVerified && <VerifiedBadge size="sm" />}
              </div>
              {partner.jobTitle && <p className="text-xs text-muted-foreground">{partner.jobTitle}</p>}
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-8">Say hello! All conversations are private.</p>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === session?.user?.id
          return (
            <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div className={cn(
                "max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm break-words",
                isMine ? "bg-primary-600 text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
              )}>
                <p>{msg.content}</p>
                <p className={cn("text-[10px] mt-1", isMine ? "text-blue-200" : "text-muted-foreground")}>
                  {formatRelativeTime(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="bg-card border-t border-border p-4 shrink-0"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || sending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
