import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email"

const CONTACT_INBOX = "collaboration@korpo.in"

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 })
    }

    // Also logged so submissions are visible in server logs even if the
    // email send is skipped (e.g. RESEND_API_KEY not configured locally).
    console.log("[Contact Form]", { name, email, subject, message, at: new Date().toISOString() })

    await sendEmail({
      to: CONTACT_INBOX,
      replyTo: email,
      subject: `[Contact] ${subject} — ${name}`,
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:0 auto">
          <h2 style="margin:0 0 16px;font-size:18px;color:#111827">New contact form submission</h2>
          <p style="margin:0 0 4px;color:#111827"><strong>From:</strong> ${name} &lt;${email}&gt;</p>
          <p style="margin:0 0 16px;color:#111827"><strong>Subject:</strong> ${subject}</p>
          <p style="margin:0;color:#374151;white-space:pre-wrap;line-height:1.6">${message}</p>
        </div>`,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 })
  }
}
