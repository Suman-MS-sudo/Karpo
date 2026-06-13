"use client"
import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
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
  company: { name: string } | null
}

export default function MessageThreadPage() {
  const { data: session } = useSession()
  const params = useParams()
  const partnerId = params.userId as string
  const [messages, setMessages] = useState<Message[]>([])
  const [partner, setPartner] = useState<Partner | null>(null)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch(`/api/profile/${partnerId}`).then((r) => r.json()).then((d) => setPartner(d))

    const fetchMessages = () =>
      fetch(`/api/messages/${partnerId}`).then((r) => r.json()).then((d) => setMessages(d.messages ?? []))

    fetchMessages()

    // Clear any stale interval before creating a new one
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(fetchMessages, 10_000)

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [partnerId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    const content = input.trim()
    setInput("")
    // Optimistic update
    const tempMsg: Message = { id: "temp-" + Date.now(), senderId: session!.user!.id, content, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, tempMsg])
    try {
      const res = await fetch(`/api/messages/${partnerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        {partner && (
          <>
            <Avatar className="h-9 w-9">
              <AvatarImage src={partner.avatarUrl ?? partner.image ?? ""} />
              <AvatarFallback>{getInitials(partner.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <Link href={`/profile/${partner.id}`} className="font-medium hover:underline">{partner.name}</Link>
                {partner.isVerified && <VerifiedBadge size="sm" />}
              </div>
              {partner.company && <p className="text-xs text-muted-foreground">{partner.company.name}</p>}
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
              <div className={cn("max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm", isMine ? "bg-primary-600 text-white rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                <p>{msg.content}</p>
                <p className={cn("text-[10px] mt-1", isMine ? "text-blue-200" : "text-muted-foreground")}>{formatRelativeTime(msg.createdAt)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-card border-t border-border p-4">
        <form onSubmit={sendMessage} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message…"
            className="flex-1"
            autoFocus
          />
          <Button type="submit" disabled={!input.trim() || sending} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
