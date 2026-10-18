/**
 * Removes dummy Korpo seed deals: every inactive MANUAL deal, plus any deal
 * whose coupon code contains "KORP" (e.g. KORPO20, KORPOONE).
 * Keeps Amazon/Flipkart product deals, Samsung EPP, Dell, IFB and epp-* rows.
 *
 * Run: node --env-file=.env.local scripts/delete-dummy-deals.mjs
 */

import { createClient } from "@libsql/client"

const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const where = "(source = 'MANUAL' AND isActive = 0) OR UPPER(COALESCE(code,'')) LIKE '%KORP%'"

const n = await db.execute("SELECT COUNT(*) c FROM Deal WHERE " + where)
console.log("Deleting", n.rows[0].c, "dummy deals")
await db.execute("DELETE FROM DealRedemption WHERE dealId IN (SELECT id FROM Deal WHERE " + where + ")")
await db.execute("DELETE FROM Deal WHERE " + where)

const r = await db.execute("SELECT source, isActive, COUNT(*) c FROM Deal GROUP BY source, isActive")
console.log("Remaining:", r.rows.map((x) => JSON.stringify(x)).join(" "))
