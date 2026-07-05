import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { sendEmail } from "@/lib/email"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { to } = await req.json()
  if (!to) return NextResponse.json({ error: "Missing 'to'" }, { status: 400 })

  try {
    await sendEmail({
      to,
      subject: "Korpo Email Test",
      html: `<p style="font-family:sans-serif">Email is working! Sent via Resend from <strong>${process.env.EMAIL_FROM}</strong> at ${new Date().toISOString()}</p>`,
    })
    return NextResponse.json({ ok: true, message: `Test email sent to ${to}` })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
