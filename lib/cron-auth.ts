import { timingSafeEqual } from "crypto"

/**
 * Validates a cron request's Authorization: Bearer <CRON_SECRET> header using
 * a constant-time comparison. Vercel's Cron Jobs automatically send this
 * header when CRON_SECRET is set as an env var, so this is the only check
 * needed — no separate "is this Vercel" signal exists that can't be forged
 * by an outside caller, so presence-only checks must never be trusted.
 */
export function isAuthorizedCronRequest(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET ?? ""
  if (!cronSecret) return false

  const authHeader = req.headers.get("Authorization") ?? ""
  const expected = `Bearer ${cronSecret}`

  const a = Buffer.from(authHeader)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
