import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 })
    }

    // Log to console so admins can see contact submissions until email is wired up
    console.log("[Contact Form]", { name, email, subject, message, at: new Date().toISOString() })

    // TODO: send via Resend when API key is configured
    // await resend.emails.send({
    //   from: "Karpo Contact <noreply@karpo.in>",
    //   to: "hello@karpo.in",
    //   replyTo: email,
    //   subject: `[Contact] ${subject} — ${name}`,
    //   text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
    // })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 })
  }
}
