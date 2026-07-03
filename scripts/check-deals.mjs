import { createClient } from "@libsql/client"
const db = createClient({ url: process.env.TURSO_DATABASE_URL, authToken: process.env.TURSO_AUTH_TOKEN })
const { rows } = await db.execute("SELECT id, title, affiliateUrl, salePrice, affiliateNetwork FROM Deal LIMIT 5")
for (const r of rows) console.log({ id: r[0], title: String(r[1]).slice(0,40), affiliateUrl: r[2], salePrice: r[3], network: r[4] })
process.exit(0)
