import type { Prisma } from "@prisma/client"

/**
 * The only User fields that may be shown to *other* users (listing cards,
 * detail pages, API responses read by the client).
 *
 * Never use `user: true` / `user: { include: … }` for anything that reaches
 * another user — that serialises the whole row (passwordHash, corporate and
 * personal email, phone, blood group …) into the response or RSC payload.
 * Corporate email in particular must stay private: it reveals employment
 * affiliation and is collected only for verification (see Privacy Policy §7).
 */
export const PUBLIC_USER_SELECT = {
  id:              true,
  name:            true,
  username:        true,
  image:           true,
  avatarUrl:       true,
  city:            true,
  department:      true,
  jobTitle:        true,
  isVerified:      true,
  reputationScore: true,
  createdAt:       true,
} satisfies Prisma.UserSelect

/** Public user fields plus the employer *name* only (never its logo — see PUBLIC_COMPANY_SELECT). */
export const PUBLIC_COMPANY_SELECT = { name: true } satisfies Prisma.CompanySelect

export const PUBLIC_USER_WITH_COMPANY_SELECT = {
  ...PUBLIC_USER_SELECT,
  company: { select: PUBLIC_COMPANY_SELECT },
} satisfies Prisma.UserSelect
