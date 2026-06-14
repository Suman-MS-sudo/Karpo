"use client"
import { useState, useRef, useEffect } from "react"
import { Share2, Link2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

// ── Platform SVG icons ─────────────────────────────────────────────────────

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current shrink-0">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)
const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current shrink-0">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.738l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current shrink-0">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

// ── Social platform configurations (also exported for profile social links) ──

export const SOCIAL_PLATFORMS = [
  {
    id: "linkedin",
    name: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
    icon: LinkedInIcon,
    textColor: "text-[#0077B5]",
    shareUrl: (url: string, title: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    id: "twitter",
    name: "Twitter / X",
    placeholder: "https://twitter.com/username",
    icon: XIcon,
    textColor: "text-foreground",
    shareUrl: (url: string, title: string) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    placeholder: "",
    icon: WhatsAppIcon,
    textColor: "text-[#25D366]",
    shareUrl: (url: string, title: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`,
  },
  {
    id: "facebook",
    name: "Facebook",
    placeholder: "https://facebook.com/username",
    icon: FacebookIcon,
    textColor: "text-[#1877F2]",
    shareUrl: (url: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
]

// ── Profile social link platforms (superset — includes non-shareable ones) ──

export const PROFILE_SOCIAL_PLATFORMS = [
  { id: "linkedin",  name: "LinkedIn",   placeholder: "https://linkedin.com/in/username",  textColor: "text-[#0077B5]",  icon: LinkedInIcon },
  { id: "twitter",   name: "Twitter / X", placeholder: "https://twitter.com/username",      textColor: "text-foreground", icon: XIcon },
  {
    id: "github", name: "GitHub", placeholder: "https://github.com/username", textColor: "text-foreground",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current shrink-0">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
  {
    id: "instagram", name: "Instagram", placeholder: "https://instagram.com/username", textColor: "text-[#E4405F]",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current shrink-0">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  {
    id: "youtube", name: "YouTube", placeholder: "https://youtube.com/@channel", textColor: "text-[#FF0000]",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current shrink-0">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
  },
  {
    id: "website", name: "Website / Portfolio", placeholder: "https://yourwebsite.com", textColor: "text-indigo-600 dark:text-indigo-400",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-none stroke-current stroke-[1.5] shrink-0">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  { id: "facebook", name: "Facebook", placeholder: "https://facebook.com/username", textColor: "text-[#1877F2]", icon: FacebookIcon },
]

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
