import { NextResponse } from "next/server"
import { auth } from "@/auth"
import type { Session } from "next-auth"

// Our module augmentation in types/index.ts extends Session["user"] with custom fields.
// We assert the session shape here so callers get typed access to those fields.
type KorpoSession = Session & {
  user: NonNullable<Session["user"]> & {
    id: string
    isVerified?: boolean
    companyId?: string
    membershipPlan?: string
    city?: string
    avatarUrl?: string
    company?: { name: string; logo: string | null; domain: string } | null
  }
}

type AuthResult =
  | { session: KorpoSession; error?: never }
  | { session?: never; error: NextResponse }

/** Requires a valid session. Returns 401 if not authenticated. */
export async function requireAuth(): Promise<AuthResult> {
  const raw = await auth()
  const session = raw as KorpoSession | null
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { session }
}

/** Requires a session AND corporate verification. Returns 401/403 otherwise. */
export async function requireVerified(): Promise<AuthResult> {
  const raw = await auth()
  const session = raw as KorpoSession | null
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  if (!session.user.isVerified) {
    return {
      error: NextResponse.json(
        { error: "Corporate verification required. Your company domain must be approved." },
        { status: 403 }
      ),
    }
  }
  return { session }
}
