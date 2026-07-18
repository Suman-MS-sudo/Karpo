import { Resend } from "resend"

// Lazy client — instantiated on first use so build doesn't fail without RESEND_API_KEY
let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

const FROM = process.env.EMAIL_FROM ?? "Korpo <onboarding@resend.dev>"

interface EmailPayload {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailPayload) {
  const resend = getResend()
  if (!resend) {
    console.warn("RESEND_API_KEY not set — skipping email")
    return
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    if (error) throw error
  } catch (err) {
    console.error("Email send failed:", err)
    throw err
  }
}

// ── OTP email ─────────────────────────────────────────────────────────────────

interface OTPEmailOptions {
  to: string
  otp: string
  isNewUser: boolean
}

export async function sendOTPEmail({ to, otp, isNewUser }: OTPEmailOptions): Promise<{ success: boolean; error?: string }> {
  const subject = isNewUser ? "Welcome to Korpo — Verify your email" : "Your Korpo sign-in code"

  const greeting = isNewUser
    ? "You're joining Korpo's verified corporate network. Use this code to verify your email."
    : "Use this code to sign in to your Korpo account."

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#fff;margin:0;padding:32px 16px">
  <div style="max-width:480px;margin:0 auto">
    <h2 style="margin:0 0 24px;font-size:20px;font-weight:700;color:#111827">Korpo</h2>
    <p style="margin:0 0 24px;color:#111827;font-size:16px;line-height:1.5">
      ${isNewUser
        ? "You're joining Korpo's verified corporate network. Use this code to verify your email."
        : "Use this code to sign in to your Korpo account."}
    </p>
    <p style="margin:0 0 24px;font-size:32px;font-weight:700;letter-spacing:.2em;color:#111827">${otp}</p>
    <p style="margin:0 0 24px;color:#6b7280;font-size:14px;line-height:1.5">
      This code expires in 10 minutes. If you didn't request it, you can ignore this email.
    </p>
    <p style="margin:0;color:#9ca3af;font-size:13px">Korpo — corporate employee marketplace</p>
  </div>
</body>
</html>`

  const text = `Korpo\n\n${greeting}\n\nYour code: ${otp}\n\nThis code expires in 10 minutes. If you didn't request it, you can ignore this email.\n\nKorpo — corporate employee marketplace`

  const resend = getResend()
  if (!resend) {
    console.log(`\n${"─".repeat(50)}`)
    console.log(`[KORPO DEV] OTP Email`)
    console.log(`To:  ${to}`)
    console.log(`OTP: ${otp}`)
    console.log(`${"─".repeat(50)}\n`)
    return { success: true }
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject,
      html,
      text,
    })
    if (error) {
      console.error("[OTP Email] Resend error:", error)
      return { success: false, error: "Failed to send email" }
    }
    return { success: true }
  } catch (err) {
    console.error("[OTP Email] Resend error:", err)
    return { success: false, error: "Failed to send email" }
  }
}

// ── ID card verification approval notice ───────────────────────────────────────

export async function sendIdVerificationApprovedEmail(to: string): Promise<{ success: boolean; error?: string }> {
  const subject = "Your Korpo ID card verification was approved"

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;margin:0;padding:32px 16px">
  <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
    <div style="background:#1e40af;padding:24px 32px">
      <span style="color:#fff;font-weight:700;font-size:22px">Korpo</span>
    </div>
    <div style="padding:32px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827">You're verified!</h1>
      <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.5">
        An admin approved your organization ID card verification. Sign in with your corporate email and the password you set when you submitted your request.
      </p>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">
        Korpo · Corporate-only verified network<br>This is an automated message — do not reply.
      </p>
    </div>
  </div>
</body>
</html>`

  const resend = getResend()
  if (!resend) {
    console.log(`\n${"─".repeat(50)}`)
    console.log(`[KORPO DEV] ID verification approved email`)
    console.log(`To: ${to}`)
    console.log(`${"─".repeat(50)}\n`)
    return { success: true }
  }

  try {
    const { error } = await resend.emails.send({ from: FROM, to: [to], subject, html })
    if (error) {
      console.error("[ID Verification Approved Email] Resend error:", error)
      return { success: false, error: "Failed to send email" }
    }
    return { success: true }
  } catch (err) {
    console.error("[ID Verification Approved Email] Resend error:", err)
    return { success: false, error: "Failed to send email" }
  }
}

export function welcomeEmailHtml(name: string): string {
  return `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:#1E3A5F;padding:24px;border-radius:12px 12px 0 0;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:24px">Welcome to Korpo</h1>
        <p style="color:#a3c4e8;margin:8px 0 0">Your work ID. Your pass to everything else.</p>
      </div>
      <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
        <p style="color:#1a202c;font-size:16px">Hi ${name},</p>
        <p style="color:#64748b">You're now part of India's first verified corporate employee marketplace.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
           style="display:inline-block;background:#1E3A5F;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;font-weight:600">
          Go to Dashboard →
        </a>
      </div>
    </div>
  `
}
