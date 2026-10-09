// Blocks phone numbers and email addresses hidden in free-text fields (listing
// descriptions, messages, bios, etc.) so users can't route around paid
// messaging by exchanging contact info directly in public/free content.
// Not meant to be airtight — regex catches casual leakage (the common case);
// determined evasion (e.g. screenshots) is a known, accepted gap.

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/

// Matches runs of digits interspersed with common separators (spaces, dashes,
// dots, parens) — covers "+91 98765 43210", "9876543210", "987-654-3210",
// and looser spacing like "9629 - 30 34 38", etc. The separator allowance
// needs to be generous enough to span " - " (space-dash-space) between
// digit groups, or numbers split that way slip through undetected.
const PHONE_RUN_RE = /(?:\+?\d[\s.\-()]{0,4}){9,15}/g

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

// Spelled-out digits ("nine six two...") dodge the digit-based regex above
// entirely. Map single-digit and round two-digit number words so a run of
// them can be concatenated back into digits and checked the same way.
const NUMBER_WORDS: Record<string, string> = {
  zero: "0", oh: "0",
  one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9",
  twenty: "20", thirty: "30", forty: "40", fifty: "50",
  sixty: "60", seventy: "70", eighty: "80", ninety: "90",
}

// A run of this many consecutive number-words ("nine nine six six forty
// two…") almost never occurs in genuine prose — block on the run itself
// rather than waiting for it to reconstruct into a full 10-digit phone
// shape, since shorter runs (partial numbers, digits split across a
// sentence) would otherwise slip through.
const MIN_SPELLED_NUMBER_WORD_RUN = 4

function findSpelledOutPhoneNumber(text: string): boolean {
  const words = text.toLowerCase().match(/[a-z]+/g) ?? []
  let run = ""
  let runWordCount = 0
  for (const word of words) {
    const digits = NUMBER_WORDS[word]
    if (!digits) {
      run = ""
      runWordCount = 0
      continue
    }
    run += digits
    runWordCount++
    if (runWordCount >= MIN_SPELLED_NUMBER_WORD_RUN) return true
    for (let len = 10; len <= 13 && len <= run.length; len++) {
      if (looksLikePhoneNumber(run.slice(run.length - len))) return true
    }
  }
  return false
}

export function findContactInfo(text: string): "email" | "phone" | null {
  if (!text) return null
  if (EMAIL_RE.test(text)) return "email"
  const matches = text.match(PHONE_RUN_RE) ?? []
  for (const match of matches) {
    if (looksLikePhoneNumber(normalizedDigits(match))) return "phone"
  }
  if (findSpelledOutPhoneNumber(text)) return "phone"
  return null
}

// Titles are short by nature — legitimate ones rarely carry more than a
// couple of stray digits (e.g. "2BHK"). A hard cap is far more robust than
// pattern-matching against a phone-number shape, since it can't be dodged by
// re-grouping or spacing digits differently.
export const MAX_TITLE_DIGITS = 6

export function titleHasTooManyDigits(title: string, max = MAX_TITLE_DIGITS): boolean {
  if (!title) return false
  const digitCount = (title.match(/\d/g) ?? []).length
  return digitCount > max
}

export function titleDigitLimitError(max = MAX_TITLE_DIGITS) {
  return `Title can contain at most ${max} digit${max === 1 ? "" : "s"} — remove any phone numbers from the title.`
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
