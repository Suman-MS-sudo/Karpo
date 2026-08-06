import SignInClient from "./SignInClient"

// Server-computed so the "Continue with LinkedIn" button is present (or absent)
// in the very first render — no client-side fetch/flash after page load.
// Temporarily disabled — flip back to the env check to re-enable.
const linkedinAvailable = false

export default function SignInPage() {
  return <SignInClient linkedinAvailable={linkedinAvailable} />
}
