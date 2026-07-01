"use client"
import { useChatContext } from "./ChatContext"
import { cn } from "@/lib/utils"

interface Props {
  partnerId:    string
  partnerName:  string
  partnerAvatar?: string
  partnerJobTitle?: string
  isVerified?:  boolean
  children:     React.ReactNode
  className?:   string
  variant?:     "default" | "outline" | "ghost"
}

/**
 * Drop-in replacement for a <Link href="/messages/[userId]"> that instead
 * opens the floating chat window for the partner.  Falls back gracefully
 * if the chat context is unavailable.
 */
export function OpenChatButton({
  partnerId,
  partnerName,
  partnerAvatar,
  partnerJobTitle,
  isVerified,
  children,
  className,
}: Props) {
  const { openChat } = useChatContext()

  return (
    <button
      type="button"
      onClick={() =>
        openChat({
          id:        partnerId,
          name:      partnerName,
          avatarUrl: partnerAvatar,
          jobTitle:  partnerJobTitle,
          isVerified,
        })
      }
      className={cn("cursor-pointer", className)}
    >
      {children}
    </button>
  )
}
