// Normalizes phone input to a consistent E.164-ish format so the same number
// always matches on lookup regardless of how it was typed (spaces, dashes, etc.)
export function normalizePhone(input: string): string {
  const trimmed = input.trim()
  const hasPlus = trimmed.startsWith("+")
  const digits = trimmed.replace(/\D/g, "")

  if (hasPlus) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  return `+${digits}`
}
