// Blocks phone numbers and email addresses hidden in free-text fields (listing
// descriptions, messages, bios, etc.) so users can't route around paid
// messaging by exchanging contact info directly in public/free content.
// Not meant to be airtight — regex catches casual leakage (the common case);
// determined evasion (spelled-out digits, screenshots) is a known, accepted gap.

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/

// Matches runs of digits interspersed with common separators (spaces, dashes,
// dots, parens) — covers "+91 98765 43210", "9876543210", "987-654-3210", etc.
const PHONE_RUN_RE = /(?:\+?\d[\s.\-()]{0,2}){9,15}/g

function normalizedDigits(match: string): string {
  return match.replace(/\D/g, "")
}

// A run of 10-13 digits (with a plausible mobile-number shape) inside prose is
// almost always a phone number — legitimate free text rarely contains a bare
// 10+ digit sequence.
function looksLikePhoneNumber(digits: string): boolean {
  if (digits.length < 10 || digits.length > 13) return false
  const last10 = digits.slice(-10)
  return /^[6-9]/.test(last10)
}

export function findContactInfo(text: string): "email" | "phone" | null {
  if (!text) return null
  if (EMAIL_RE.test(text)) return "email"
  const matches = text.match(PHONE_RUN_RE) ?? []
  for (const match of matches) {
    if (looksLikePhoneNumber(normalizedDigits(match))) return "phone"
  }
  return null
}

// Checks a set of free-text fields (e.g. { title, description }) and returns
// the name of the first one containing contact info, or null if none do.
export function findContactInfoField(fields: Record<string, string | undefined | null>): string | null {
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "string" && findContactInfo(value)) return key
  }
  return null
}

export function contactInfoError(field: string) {
  return `Phone numbers and email addresses aren't allowed in "${field}". Share contact details through Korpo messaging instead.`
}
