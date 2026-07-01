import { createClient } from "@libsql/client"

const db = createClient({
  url:       "libsql://korpo-csinsights96-glitch.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODI1NTkzMDYsImlkIjoiMDE5ZjA4ZDAtNTIwMS03NDllLThlOTEtMzVkZmVmZTE4YzY3IiwicmlkIjoiYTU5MmFiZWUtNWE3Yy00YzFmLWFhZDEtMjFjYTdiMGNiYTVmIn0._lD-rmn9Eeg5yhJgIdo0Z0iuTu4AKpZWro9Cfptb2-pyZv4saKfev4omw_JSJnNKifX7IMStL65P_xhwDobDBA",
})

// Convert "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SS.000Z"
function fixTs(val) {
  if (!val) return null
  if (val.includes("T")) return val  // already ISO
  return val.replace(" ", "T") + ".000Z"
}

const { rows } = await db.execute("SELECT id, createdAt, updatedAt, lastUpdated, validUntil, validFrom FROM Deal")

let fixed = 0
for (const row of rows) {
  const id          = row[0] ?? row.id
  const createdAt   = row[1] ?? row.createdAt
  const updatedAt   = row[2] ?? row.updatedAt
  const lastUpdated = row[3] ?? row.lastUpdated
  const validUntil  = row[4] ?? row.validUntil
  const validFrom   = row[5] ?? row.validFrom
  {

  await db.execute({
    sql: `UPDATE Deal SET
      createdAt   = ?,
      updatedAt   = ?,
      lastUpdated = ?,
      validUntil  = ?,
      validFrom   = ?
    WHERE id = ?`,
    args: [
      fixTs(createdAt),
      fixTs(updatedAt),
      fixTs(lastUpdated),
      fixTs(validUntil),
      validFrom ? fixTs(validFrom) : null,
      id,
    ],
  })
  fixed++
  }
}

db.close()
console.log(`Fixed datetime format on ${fixed} Deal rows.`)
