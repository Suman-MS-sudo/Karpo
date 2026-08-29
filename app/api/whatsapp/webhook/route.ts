import { NextRequest, NextResponse } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"

// Meta calls this with GET once, to verify you own the callback URL.
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const mode = searchParams.get("hub.mode")
  const token = searchParams.get("hub.verify_token")
  const challenge = searchParams.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 })
  }
  return new NextResponse("Forbidden", { status: 403 })
}

// Verifies Meta's X-Hub-Signature-256 header: HMAC-SHA256 of the raw request
// body, keyed with the WhatsApp app secret. Without this, anyone who
// discovers the URL can POST forged messages.
function isValidMetaSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret || !signatureHeader) return false

  const expected = "sha256=" + createHmac("sha256", appSecret).update(rawBody).digest("hex")
  const a = Buffer.from(signatureHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

// Meta calls this with POST for every inbound message / delivery status update.
export async function POST(req: NextRequest) {
  const rawBody = await req.text()

  if (!isValidMetaSignature(rawBody, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  const body = JSON.parse(rawBody)
  console.log("[WhatsApp webhook]", JSON.stringify(body, null, 2))
  return NextResponse.json({ received: true })
}
