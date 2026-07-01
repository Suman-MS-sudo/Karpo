"use client"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatContext } from "@/components/chat/ChatContext"

interface Props {
  sellerId:     string
  sellerName:   string
  sellerAvatar: string
  sellerJobTitle?: string
  isVerified?:  boolean
}

export function MessageSellerButton({
  sellerId,
  sellerName,
  sellerAvatar,
  sellerJobTitle,
  isVerified,
}: Props) {
  const { openChat } = useChatContext()

  return (
    <Button
      className="w-full gap-2"
      onClick={() =>
        openChat({
          id:        sellerId,
          name:      sellerName,
          avatarUrl: sellerAvatar,
          jobTitle:  sellerJobTitle,
          isVerified,
        })
      }
    >
      <MessageSquare className="h-4 w-4" />
      Message Seller
    </Button>
  )
}
