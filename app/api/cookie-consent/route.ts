import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// Records a cookie-consent decision (see lib/cookie-consent.ts) as evidence of
// what the visitor chose, under which policy version, and when. Public route —
// anonymous visitors answer the banner too.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { id?: unknown; v?: unknown; functional?: unknown } | null
  if (
    !body ||
    typeof body.id !== "string" || body.id.length > 64 ||
    typeof body.v !== "string" || body.v.length > 32 ||
    typeof body.functional !== "boolean"
  ) {
    return NextResponse.json({ error: "Invalid consent" }, { status: 400 })
  }

  const session = await auth().catch(() => null)
  await prisma.cookieConsentLog.create({
    data: {
      consentId:  body.id,
      userId:     session?.user?.id ?? null,
      version:    body.v,
      functional: body.functional,
      userAgent:  req.headers.get("user-agent")?.slice(0, 300) ?? null,
    },
  })
  return NextResponse.json({ ok: true })
}
