import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { TERMS_VERSION } from "@/lib/legal-versions"

// Click-wrap acceptance of the current Terms + Privacy Policy. Records which
// version was accepted and when, so acceptance can be evidenced later.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null) as { version?: unknown; agreed?: unknown } | null
  if (body?.agreed !== true || body.version !== TERMS_VERSION) {
    return NextResponse.json({ error: "Please accept the current Terms and Privacy Policy." }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}
