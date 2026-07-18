"use client"
import { useState, useRef, useEffect } from "react"
import { Share2, Link2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SOCIAL_PLATFORMS } from "@/lib/socialPlatforms"

// ── Share component ────────────────────────────────────────────────────────

type SocialShareProps = {
  title: string
  description?: string
  path?: string       // e.g. "/marketplace/abc123" — if omitted, uses current page URL
  className?: string
  variant?: "button" | "icon"
}

export function SocialShare({ title, description, path, className, variant = "button" }: SocialShareProps) {
  const [open, setOpen]   = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setShareUrl(path ? window.location.origin + path : window.location.href)
  }, [path])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClick = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: description, url: shareUrl })
        return
      } catch { /* user dismissed or API unavailable — fall through to popover */ }
    }
    setOpen((o) => !o)
  }

  return (
    // onClick stopPropagation on the wrapper prevents card <Link> navigation when share is inside a card
    <div
      className={cn("relative", className)}
      ref={ref}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleClick}
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
          variant === "icon"
            ? "h-9 w-9 justify-center rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
            : "h-9 px-3 justify-center rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
        )}
        title="Share"
      >
        <Share2 className="h-4 w-4 shrink-0" />
        {variant === "button" && <span>Share</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 bg-popover border border-border rounded-xl shadow-xl p-1.5 animate-in fade-in slide-in-from-top-2 duration-100">
          <div className="flex items-center justify-between px-2 py-1.5 mb-0.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Share via</p>
            <button
              onClick={() => setOpen(false)}
              className="h-5 w-5 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>

          {SOCIAL_PLATFORMS.map(({ id, name, icon: Icon, textColor, shareUrl: buildUrl }) => (
            <a
              key={id}
              href={buildUrl(shareUrl, title)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-muted",
                textColor
              )}
            >
              <Icon />
              {name}
            </a>
          ))}

          <div className="h-px bg-border my-1" />

          <button
            onClick={copyLink}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {copied
              ? <Check className="h-[18px] w-[18px] text-green-500 shrink-0" />
              : <Link2 className="h-[18px] w-[18px] shrink-0" />
            }
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      )}
    </div>
  )
}
