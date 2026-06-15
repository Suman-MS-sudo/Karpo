import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { VerifiedBadge } from "./VerifiedBadge"
import { getInitials } from "@/lib/utils"
interface UserCardUser {
  id: string
  name?: string | null
  image?: string | null
  avatarUrl?: string | null
  isVerified?: boolean
  jobTitle?: string | null
  department?: string | null
  company?: { name: string; logo?: string | null; domain?: string } | null
}

interface UserCardProps {
  user: UserCardUser
  size?: "sm" | "md" | "lg"
  clickable?: boolean
}

export function UserCard({ user, size = "md", clickable = true }: UserCardProps) {
  const avatarSize = size === "sm" ? "h-8 w-8" : size === "md" ? "h-10 w-10" : "h-12 w-12"
  const nameSize = size === "sm" ? "text-sm" : size === "md" ? "text-sm" : "text-base"
  const subSize = "text-xs text-muted-foreground"

  const content = (
    <div className="flex items-center gap-3">
      <Avatar className={avatarSize}>
        <AvatarImage src={user.avatarUrl ?? user.image ?? ""} alt={user.name ?? ""} />
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`${nameSize} font-medium text-foreground truncate`}>{user.name ?? "Anonymous"}</span>
          {user.isVerified && <VerifiedBadge size="sm" />}
        </div>
        {(user.jobTitle || user.department) && (
          <p className={`${subSize} mt-0.5`}>{user.jobTitle ?? user.department}</p>
        )}
      </div>
    </div>
  )

  if (!clickable) return content

  return (
    <Link href={`/profile/${user.id}`} className="hover:opacity-80 transition-opacity">
      {content}
    </Link>
  )
}
