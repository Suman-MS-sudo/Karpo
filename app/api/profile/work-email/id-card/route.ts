import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-auth"
import { prisma } from "@/lib/prisma"
import { isDomainBlocked } from "@/lib/domains"

// Lets an already logged-in user re-verify a new work email by submitting an
// org ID card instead of OTP — e.g. their new employer's mail server can't be
// probed automatically. Reviewed by an admin, flagged as an existing-user
// request (requestType: REVERIFICATION) so it's not confused with a fresh signup.
export async function POST(req: Request) {
  const { session, error } = await requireAuth()
  if (error) return error

  const { corpEmail, phone, fullName, employeeId, designation, frontImageUrl, backImageUrl } = await req.json()

  if (!corpEmail || typeof corpEmail !== "string") {
    return NextResponse.json({ error: "Work email is required" }, { status: 400 })
  }
  if (!phone || !fullName || !frontImageUrl || !backImageUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const normalized = corpEmail.trim().toLowerCase()
  const { blocked, reason } = isDomainBlocked(normalized)
  if (blocked) {
    const message =
      reason === "personal"
        ? "Personal email providers (Gmail, Yahoo, Outlook, etc.) are not allowed. Please use your corporate email."
        : reason === "temp"
        ? "Temporary or disposable email addresses are not allowed."
        : "Please enter a valid corporate email address."
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const existingOwner = await prisma.user.findFirst({
    where: { OR: [{ email: normalized }, { workEmail: normalized }], NOT: { id: session.user.id } },
    select: { id: true },
  })
  if (existingOwner) {
    return NextResponse.json({ error: "This email is already linked to another account." }, { status: 409 })
  }

  await prisma.idVerificationRequest.upsert({
    where: { corpEmail: normalized },
    update: {
      phone,
      fullName,
      employeeId: employeeId || null,
      designation: designation || null,
      frontImageUrl,
      backImageUrl,
      status: "PENDING",
      requestType: "REVERIFICATION",
      userId: session.user.id,
      reviewedAt: null,
    },
    create: {
      corpEmail: normalized,
      phone,
      fullName,
      employeeId: employeeId || null,
      designation: designation || null,
      frontImageUrl,
      backImageUrl,
      status: "PENDING",
      requestType: "REVERIFICATION",
      userId: session.user.id,
    },
  })

  return NextResponse.json({ ok: true })
}
