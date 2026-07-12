import { NextRequest, NextResponse } from "next/server"

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

// Meta calls this with POST for every inbound message / delivery status update.
export async function POST(req: NextRequest) {
  const body = await req.json()
  console.log("[WhatsApp webhook]", JSON.stringify(body, null, 2))
  return NextResponse.json({ received: true })
}
