import SignInClient from "./SignInClient"

// Server-computed so the "Continue with LinkedIn" button is present (or absent)
// in the very first render — no client-side fetch/flash after page load.
const linkedinAvailable = Boolean(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET)

export default function SignInPage() {
  return <SignInClient linkedinAvailable={linkedinAvailable} />
}
