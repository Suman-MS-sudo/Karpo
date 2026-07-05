import type {
  User,
  Company,
  Listing,
  RentalPost,
  JobReferral,
  CarpoolRoute,
  ServicePost,
  Deal,
  Event,
  Course,
  ConciergeLead,
  BenefitProduct,
  Review,
  Message,
  Notification,
  Membership,
} from "@prisma/client"

// ─── Auth session extension ───────────────────────────────────────────────────
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      isVerified?: boolean
      companyId?: string
      workEmail?: string
      city?: string
      avatarUrl?: string
      membershipPlan?: string
      company?: {
        name: string
        logo: string | null
        domain: string
      } | null
    }
  }
}

// ─── Re-exports ───────────────────────────────────────────────────────────────
export type {
  User,
  Company,
  Listing,
  RentalPost,
  JobReferral,
  CarpoolRoute,
  ServicePost,
  Deal,
  Event,
  Course,
  ConciergeLead,
  BenefitProduct,
  Review,
  Message,
  Notification,
  Membership,
}

// ─── Enriched types ───────────────────────────────────────────────────────────

export type UserWithCompany = User & {
  company: Company | null
  membership: Membership | null
}

export type ListingWithUser = Listing & {
  user: UserWithCompany
}

export type RentalWithUser = RentalPost & {
  user: UserWithCompany
}

export type JobReferralWithUser = JobReferral & {
  user: UserWithCompany
  company: Company
}

export type CarpoolWithUser = CarpoolRoute & {
  user: UserWithCompany
}

export type ServicePostWithUser = ServicePost & {
  user: UserWithCompany
}

export type EventWithOrganizer = Event & {
  organizer: UserWithCompany
  _count: { rsvps: number }
}

export type CourseWithInstructor = Course & {
  instructor: UserWithCompany
}

export type ReviewWithReviewer = Review & {
  reviewer: UserWithCompany
}

export type ConversationPartner = {
  userId: string
  name: string | null
  image: string | null
  company: { name: string; logo: string | null } | null
  lastMessage: string
  lastMessageAt: Date
  unreadCount: number
}

// ─── Form types ───────────────────────────────────────────────────────────────
export type CreateListingInput = {
  title: string
  description: string
  price: number
  category: string
  images: string[]
  city: string
}

export type CreateRentalInput = {
  title: string
  type: string
  rent: number
  deposit?: number
  city: string
  area: string
  amenities: string[]
  images: string[]
  availableFrom: Date
  description?: string
}

export type CreateJobReferralInput = {
  title: string
  description: string
  department: string
  experienceMin: number
  experienceMax: number
  referralBonus?: number
  deadline?: Date
}

export type CreateCarpoolInput = {
  fromLocation: string
  toLocation: string
  departureTime: string
  seatsAvailable: number
  pricePerSeat: number
  frequency: string
  vehicleType: string
  notes?: string
}

export type CreateServicePostInput = {
  category: string
  title: string
  description: string
  priceType: string
  price?: number
  portfolio: string[]
  city?: string
}

export type ApiResponse<T> = {
  data?: T
  error?: string
  message?: string
}

export type PaginatedResponse<T> = {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}
