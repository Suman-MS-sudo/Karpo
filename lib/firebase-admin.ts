import { initializeApp, getApps, cert, type App } from "firebase-admin/app"
import { getAuth } from "firebase-admin/auth"

// Lazy singleton — instantiated on first use so build doesn't fail without
// Firebase credentials configured (same pattern as lib/email.ts's Resend client).
let _app: App | null = null

function getFirebaseAdminApp(): App | null {
  if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    return null
  }
  if (_app) return _app
  const existing = getApps()[0]
  if (existing) {
    _app = existing
    return _app
  }
  _app = initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // .env files can't hold real newlines in a quoted value — the key is
      // stored with literal "\n" escapes and must be unescaped before use.
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  })
  return _app
}

// Verifies a Firebase phone-auth ID token and returns the E.164 phone number
// it was issued for, or null if the token is missing/invalid/expired/not a
// phone-auth token.
export async function verifyFirebasePhoneToken(idToken: string): Promise<string | null> {
  const app = getFirebaseAdminApp()
  if (!app) {
    console.warn("Firebase Admin not configured — skipping phone OTP verification")
    return null
  }
  try {
    const decoded = await getAuth(app).verifyIdToken(idToken)
    return typeof decoded.phone_number === "string" ? decoded.phone_number : null
  } catch (err) {
    console.error("[verifyFirebasePhoneToken]", err)
    return null
  }
}
