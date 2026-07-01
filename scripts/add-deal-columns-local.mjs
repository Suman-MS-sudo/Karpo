import { createClient } from "@libsql/client"

const db = createClient({ url: "file:prisma/dev.db" })

const stmts = [
  `ALTER TABLE Deal ADD COLUMN validFrom DATETIME`,
  `ALTER TABLE Deal ADD COLUMN companyLogo TEXT`,
  `ALTER TABLE Deal ADD COLUMN viewCount INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Deal ADD COLUMN featured INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Deal ADD COLUMN trending INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE Deal ADD COLUMN badge TEXT`,
  `ALTER TABLE Deal ADD COLUMN source TEXT NOT NULL DEFAULT 'MANUAL'`,
  `ALTER TABLE Deal ADD COLUMN lastUpdated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP`,
]

for (const sql of stmts) {
  try {
    await db.execute(sql)
    console.log("OK:", sql.split(" ").slice(0, 6).join(" "))
  } catch (e) {
    console.log("SKIP:", e.message.split("\n")[0])
  }
}

db.close()
console.log("Done.")
