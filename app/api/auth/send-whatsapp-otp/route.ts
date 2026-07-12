import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizePhone } from "@/lib/phone"
import { sendWhatsAppTemplate } from "@/lib/whatsapp"
import { randomInt } from "crypto"

export async function POST(req: Request) {
  try {
    const { phone: rawPhone } = await req.json()
    if (!rawPhone || typeof rawPhone !== "string") {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const phone = normalizePhone(rawPhone)
    const identifier = `wa:${phone}`

    // ── Rate limit: max 3 OTPs per phone in 10 minutes (mirrors send-otp) ────
    const since = new Date(Date.now() - 10 * 60 * 1000)
    const recentCount = await prisma.verificationToken.count({
      where: { identifier, expires: { gt: since } },
    })
    if (recentCount >= 3) {
      return NextResponse.json(
        { error: "Too many requests. Please wait 10 minutes before requesting a new code." },
        { status: 429 }
      )
    }

    // Only send if a verified account owns this phone — but always respond
    // the same way either way, so the endpoint can't be used to enumerate
    // which phone numbers are registered.
    const dbUser = await prisma.user.findUnique({ where: { phone } })

    if (dbUser?.isVerified) {
      const otp = String(randomInt(100000, 999999))
      const expires = new Date(Date.now() + 5 * 60 * 1000)

      await prisma.verificationToken.deleteMany({ where: { identifier } })
      await prisma.verificationToken.create({ data: { identifier, token: otp, expires } })

      const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME ?? "otp_login"
      const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG ?? "en_US"
      await sendWhatsAppTemplate(phone.replace("+", ""), templateName, templateLang, [otp])

      // In local dev (no WhatsApp credentials configured), lib/whatsapp.ts
      // logs the OTP to the console instead of sending — return it here too
      // so the UI can auto-fill it, same convenience as the email OTP flow.
      if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_NUMBER_ID) {
        return NextResponse.json({ ok: true, devOtp: otp })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[send-whatsapp-otp]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
