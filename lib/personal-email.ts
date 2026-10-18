import { isDomainBlocked } from "@/lib/domains"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// Returns an error message if the personal email isn't acceptable, else null.
// Shared by the register form, /api/auth/send-otp and the credentials sign-in
// so the "mandatory personal email" rule can't be bypassed by skipping the UI.
export function validatePersonalEmail(personalEmail: unknown, corporateEmail: string): string | null {
  const value = typeof personalEmail === "string" ? personalEmail.trim().toLowerCase() : ""
  if (!value) return "Personal email is required."
  if (!EMAIL_RE.test(value)) return "Please enter a valid personal email address."
  if (value === corporateEmail.trim().toLowerCase()) {
    return "Personal email must be different from your corporate email."
  }
  if (isDomainBlocked(value).reason === "temp") {
    return "Temporary or disposable email addresses are not allowed."
  }
  return null
}
