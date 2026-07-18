/**
 * Triggers the deals cron sync endpoint locally.
 * Run: node --env-file=.env.local scripts/trigger-sync.mjs
 */

const base   = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
const secret = process.env.CRON_SECRET

if (!secret) { console.error("CRON_SECRET not set"); process.exit(1) }

console.log(`Triggering sync at ${base}/api/cron/deals-sync …`)
const res  = await fetch(`${base}/api/cron/deals-sync`, {
  method:  "POST",
  headers: { Authorization: `Bearer ${secret}` },
})
const data = await res.json()
console.log("Status:", res.status)
console.log("Result:", JSON.stringify(data, null, 2))
process.exit(0)
