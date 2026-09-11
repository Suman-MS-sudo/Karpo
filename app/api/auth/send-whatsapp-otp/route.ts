import { NextResponse } from "next/server"

// WhatsApp OTP login is temporarily disabled — password is the only
// supported sign-in method for now. Matching WHATSAPP_OTP_LOGIN_ENABLED
// in auth.ts and the hidden button in SignInClient.tsx.
export async function POST() {
  return NextResponse.json(
    { error: "WhatsApp OTP sign-in is currently disabled. Please use password sign-in." },
    { status: 410 }
  )
}
