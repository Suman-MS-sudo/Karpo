// Per-action limits for free (non-premium) users.
// Premium users have unlimited access to all services.

export const FREE_LIMITS = {
  marketplace:  3,   // active listings
  rentals:      2,   // active posts
  referrals:    3,   // active posts
  carpool:      1,   // active routes
  skills:       1,   // active skill listings
  events:       3,   // events created (total)
  learning:     1,   // courses listed
  concierge:    2,   // active (non-completed/cancelled) leads
  deals:        5,   // deal redemptions per calendar month
} as const

export type LimitKey = keyof typeof FREE_LIMITS

export function isPremium(membershipPlan: string | null | undefined): boolean {
  return membershipPlan === "PREMIUM"
}

export function getLimit(key: LimitKey, plan: string | null | undefined): number {
  return isPremium(plan) ? Infinity : FREE_LIMITS[key]
}

export function isAtLimit(current: number, key: LimitKey, plan: string | null | undefined): boolean {
  return !isPremium(plan) && current >= FREE_LIMITS[key]
}

export function limitLabel(key: LimitKey): string {
  return `${FREE_LIMITS[key]} on free plan · unlimited with Premium`
}
