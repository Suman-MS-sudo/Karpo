"use client"
import { useSession } from "next-auth/react"

export function useCurrentUser() {
  const { data: session, status } = useSession()
  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
    isPremium: session?.user?.membershipPlan === "PREMIUM",
    isAdmin: session?.user?.role === "ADMIN",
    isVerified: session?.user?.isVerified ?? false,
  }
}
