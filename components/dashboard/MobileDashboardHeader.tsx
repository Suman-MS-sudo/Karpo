"use client"

import Link from "next/link"
import { MapPin, ChevronDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DashboardSearchBar } from "@/components/dashboard/DashboardSearchBar"
import { getInitials, cn } from "@/lib/utils"

interface Props {
  name?: string | null
  avatarUrl?: string | null
  city?: string | null
  greeting: string
}

export function MobileDashboardHeader({ name, avatarUrl, city, greeting }: Props) {
  return (
    <div className="sticky top-0 z-40 bg-gradient-to-b from-indigo-600 to-indigo-500 text-white px-4 pt-4 pb-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <Link href="/settings" className="flex items-center gap-1.5 min-w-0">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-white/70 leading-tight">{greeting}</p>
            <p className="flex items-center gap-1 text-sm font-bold truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{city ?? "Set your city"}</span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            </p>
          </div>
        </Link>

        <Link href="/profile/me" className="shrink-0">
          <Avatar className="h-9 w-9 ring-2 ring-white/30">
            <AvatarImage src={avatarUrl ?? ""} />
            <AvatarFallback className={cn("font-outfit", "bg-white/20 text-white text-xs font-bold")}>
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>

      <DashboardSearchBar variant="light" />
    </div>
  )
}
