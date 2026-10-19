import { prisma } from "@/lib/prisma"

/**
 * Reporting + takedown for every post type except marketplace Listings (those
 * keep their own ListingReport flow). One entry per section: how to look the
 * post up, where it lives, and how an admin "Remove" takes it down.
 *
 * Takedown reuses each section's existing hidden state, so lists and detail
 * pages that already hide non-live posts keep working:
 *   RENTAL / SKILL / REFERRAL  -> status = "REMOVED"
 *   EVENT / CARPOOL            -> isActive = false
 */
export const REPORTABLE_TYPES = ["RENTAL", "SKILL", "EVENT", "REFERRAL", "CARPOOL"] as const
export type ReportableType = (typeof REPORTABLE_TYPES)[number]

export function isReportableType(v: unknown): v is ReportableType {
  return typeof v === "string" && (REPORTABLE_TYPES as readonly string[]).includes(v)
}

export interface ReportedItem { ownerId: string; title: string }

interface TypeConfig {
  label: string
  path: (id: string) => string
  load: (id: string) => Promise<ReportedItem | null>
  takedown: (id: string) => Promise<void>
}

export const CONTENT_TYPES: Record<ReportableType, TypeConfig> = {
  RENTAL: {
    label: "Rental",
    path: (id) => `/rentals/${id}`,
    load: async (id) => {
      const r = await prisma.rentalPost.findUnique({ where: { id }, select: { userId: true, title: true } })
      return r ? { ownerId: r.userId, title: r.title } : null
    },
    takedown: async (id) => { await prisma.rentalPost.update({ where: { id }, data: { status: "REMOVED" } }) },
  },
  SKILL: {
    label: "Skill",
    path: (id) => `/skills/${id}`,
    load: async (id) => {
      const r = await prisma.skillListing.findUnique({ where: { id }, select: { userId: true, title: true } })
      return r ? { ownerId: r.userId, title: r.title } : null
    },
    takedown: async (id) => { await prisma.skillListing.update({ where: { id }, data: { status: "REMOVED" } }) },
  },
  EVENT: {
    label: "Event",
    path: (id) => `/events/${id}`,
    load: async (id) => {
      const r = await prisma.event.findUnique({ where: { id }, select: { organizerId: true, title: true } })
      return r ? { ownerId: r.organizerId, title: r.title } : null
    },
    takedown: async (id) => { await prisma.event.update({ where: { id }, data: { isActive: false } }) },
  },
  REFERRAL: {
    label: "Referral",
    path: (id) => `/referrals/${id}`,
    load: async (id) => {
      const r = await prisma.jobReferral.findUnique({ where: { id }, select: { userId: true, title: true } })
      return r ? { ownerId: r.userId, title: r.title } : null
    },
    takedown: async (id) => { await prisma.jobReferral.update({ where: { id }, data: { status: "REMOVED" } }) },
  },
  CARPOOL: {
    label: "Carpool",
    path: (id) => `/carpool/${id}`,
    load: async (id) => {
      const r = await prisma.carpoolRoute.findUnique({ where: { id }, select: { userId: true, fromLocation: true, toLocation: true } })
      return r ? { ownerId: r.userId, title: `${r.fromLocation} → ${r.toLocation}` } : null
    },
    takedown: async (id) => { await prisma.carpoolRoute.update({ where: { id }, data: { isActive: false } }) },
  },
}
