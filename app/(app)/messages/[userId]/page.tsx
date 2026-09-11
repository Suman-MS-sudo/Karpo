"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, MoreVertical, ShieldOff, ShieldCheck } from "lucide-react"
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
  const [isBlocked, setIsBlocked] = useState(false)
  const [blockedByOther, setBlockedByOther] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Measure MobileNav's real rendered height (rather than guessing a fixed
  // Tailwind spacing value) so the panel's bottom inset lands exactly at its
  // top edge — MobileNav's own height varies by device (its `env(safe-area-
  // inset-bottom)` padding differs on notched phones), so this is the only
  // way to avoid either a gap above it or being covered by it.
  const [navHeight, setNavHeight] = useState<number | null>(null)
  useEffect(() => {
    const nav = document.getElementById("mobile-nav")
    if (!nav) return
    const update = () => setNavHeight(nav.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [])

  // Detect whether the browser has history to go back to
  useEffect(() => {
    setCanGoBack(window.history.length > 1)
  }, [])

  // ── Mobile keyboard handling ────────────────────────────────────────────
  // Normally this page sits in AppShell's flow like any other page, so the
  // top nav and bottom nav stay visible. But on iOS Safari, focusing the
  // input while the layout is in normal flow makes the browser PAN the
  // visual viewport to bring the input above the keyboard — since AppShell's
  // shell is `position: fixed`, that pan drags the whole app (including the
  // messages above the input) up and off-screen instead of just resizing.
  //
  // The fix: only go into the old fixed/full-screen, visualViewport-tracked
  // mode while the keyboard is actually open (detected by the visual
  // viewport shrinking well below its keyboard-closed baseline). Nav bars
  // are hidden during that window — acceptable, since the keyboard already
  // covers where the bottom nav would be — and reappear the moment the
  // keyboard closes.
  const [keyboardOpen, setKeyboardOpen] = useState(false)
  const [viewport, setViewport] = useState<{ height: number; top: number } | null>(null)
  const baselineHeightRef = useRef<number | null>(null)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const mq = window.matchMedia("(min-width: 1024px)")

    const update = () => {
      if (mq.matches) { setKeyboardOpen(false); setViewport(null); return }
      if (baselineHeightRef.current == null || vv.height > baselineHeightRef.current) {
        baselineHeightRef.current = vv.height
      }
      const shrunk = baselineHeightRef.current - vv.height > 120
      setKeyboardOpen(shrunk)
      setViewport(shrunk ? { height: vv.height, top: vv.offsetTop } : null)
    }

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

  // Stop the document itself from scrolling while the keyboard-open overlay
  // is active — a scrolled document is what desyncs the layout viewport
  // from the visual one on iOS and reproduces the pan bug this works around.
  useEffect(() => {
    if (!keyboardOpen) return
    const { style } = document.body
    const prevOverflow = style.overflow
    const prevPosition = style.position
    style.overflow = "hidden"
    style.position = "fixed"
    return () => {
      style.overflow = prevOverflow
      style.position = prevPosition
    }
  }, [keyboardOpen])

  useEffect(() => {
    fetch(`/api/profile/${partnerId}`).then((r) => r.json()).then((d) => setPartner(d))

    const fetchMessages = () =>
      fetch(`/api/messages/${partnerId}`).then((r) => r.json()).then((d) => {
        setMessages(d.messages ?? [])
        setIsBlocked(!!d.isBlocked)
        setBlockedByOther(!!d.blockedByOther)
      })

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

  const handleToggleBlock = async () => {
    setBlockLoading(true)
    setMenuOpen(false)
    try {
      await fetch(`/api/users/${partnerId}/block`, { method: isBlocked ? "DELETE" : "POST" })
      setIsBlocked((b) => !b)
    } finally {
      setBlockLoading(false)
    }
  }

  const canSend = !isBlocked && !blockedByOther

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
      // The send button briefly becomes the focused element on tap (disabled
      // the instant `input` clears, which drops focus to nothing) — on
      // mobile that's exactly what dismisses the keyboard for a beat before
      // it slides back up. Returning focus to the text input keeps the
      // keyboard open and in place through a send instead of it dipping.
      inputRef.current?.focus()
    }
  }

  return (
    // Position: fixed is the one technique that's immune to ancestor padding/
    // percentage/flex ambiguity — it's sized purely from the viewport, not
    // from <main>'s box model (which several earlier attempts here got wrong
    // in different ways: percentage heights, calc() padding math, sticky
    // positioning that only activates on actual scroll, measured-height
    // floors — all fragile). `top-14`/`bottom-20` leave exactly the same
    // room TopNav/MobileNav already occupy elsewhere, so nav stays visible;
    // the difference from the old `inset-0` version is just these insets.
    //
    // While the keyboard is open: goes full `inset-0` (covering nav) and
    // pins to the visual viewport instead (see the effect above) — see that
    // comment for why.
    <div
      className={cn(
        "flex flex-col bg-background fixed inset-x-0 z-30",
        keyboardOpen ? "inset-0 z-[60]" : "top-14",
        "lg:static lg:inset-auto lg:z-auto lg:h-[calc(100svh-4rem)]"
      )}
      style={
        keyboardOpen && viewport ? { top: viewport.top, height: viewport.height }
        : !keyboardOpen ? { bottom: navHeight ?? 80 }
        : undefined
      }
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

        <div className="ml-auto relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground transition-colors"
            title="More"
          >
            <MoreVertical className="h-4.5 w-4.5" />
          </button>
          {menuOpen && (
            <div className="absolute top-9 right-0 z-10 w-44 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
              <button
                type="button"
                onClick={handleToggleBlock}
                disabled={blockLoading}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors disabled:opacity-60"
              >
                {isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                {isBlocked ? "Unblock" : "Block"} {partner?.name}
              </button>
            </div>
          )}
        </div>
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
        {canSend ? (
          <form onSubmit={sendMessage} className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1"
            />
            {/* onMouseDown/onTouchStart preventDefault stops the button from
                stealing focus away from the input on tap — without this, focus
                moving to the (mobile) button, even for an instant, is what
                triggers the keyboard to dismiss and slide back up on send. */}
            <Button
              type="submit"
              disabled={!input.trim() || sending}
              size="icon"
              onMouseDown={(e) => e.preventDefault()}
              onTouchStart={(e) => e.preventDefault()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            {isBlocked ? "You've blocked this user." : "You can't message this user."}
          </p>
        )}
      </div>
    </div>
  )
}
