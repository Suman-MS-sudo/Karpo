/**
 * Remap existing JobReferral.department values from the old 34-item
 * department list down to the new 10 consolidated categories
 * (see data/departments.ts). Idempotent — safe to re-run.
 * Run: node scripts/migrate-referral-department-consolidation.mjs
 */
import { createClient } from "@libsql/client"
import { readFileSync } from "fs"
import { resolve } from "path"

const envLines = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8").split("\n")
for (const line of envLines) {
  if (!line.trim() || line.trim().startsWith("#")) continue
  const idx = line.indexOf("=")
  if (idx === -1) continue
  const key = line.slice(0, idx).trim()
  let val = line.slice(idx + 1).trim()
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1)
  if (!process.env[key]) process.env[key] = val
}

const TURSO_URL   = process.env.TURSO_DATABASE_URL
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN

const db = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN })

// old department name -> new consolidated category
const MAP = {
  "Engineering":                      "Engineering & IT",
  "IT / Infrastructure":              "Engineering & IT",
  "DevOps / SRE":                     "Engineering & IT",
  "Quality Assurance":                "Engineering & IT",
  "Product":                          "Product & Design",
  "Design":                           "Product & Design",
  "Data & Analytics":                 "Data & AI/ML",
  "Data Science / AI-ML":             "Data & AI/ML",
  "Research & Development":           "Data & AI/ML",
  "Sales":                            "Sales & Business Development",
  "Business Development":             "Sales & Business Development",
  "Marketing":                        "Marketing & Communications",
  "Corporate Communications / PR":    "Marketing & Communications",
  "Customer Success":                 "Customer Success & Support",
  "Customer Support":                 "Customer Success & Support",
  "Finance & Accounting":             "Finance & Legal",
  "Investor Relations":               "Finance & Legal",
  "Risk & Compliance":                "Finance & Legal",
  "Legal":                            "Finance & Legal",
  "Human Resources / People":         "Human Resources",
  "Talent Acquisition / Recruitment": "Human Resources",
  "Learning & Development":           "Human Resources",
  "Operations":                       "Operations & Strategy",
  "Strategy":                         "Operations & Strategy",
  "Program / Project Management":     "Operations & Strategy",
  "Procurement":                      "Operations & Strategy",
  "Supply Chain & Logistics":         "Operations & Strategy",
  "Manufacturing / Production":       "Operations & Strategy",
  "Administration":                   "Operations & Strategy",
  "Facilities":                       "Operations & Strategy",
  "Security":                         "Operations & Strategy",
  "Health & Safety (EHS)":            "Operations & Strategy",
  "Consulting":                       "Operations & Strategy",
  "Other":                            "Other",
}

let updated = 0
for (const [oldDept, newDept] of Object.entries(MAP)) {
  if (oldDept === newDept) continue
  const result = await db.execute({
    sql: `UPDATE JobReferral SET department = ? WHERE department = ?`,
    args: [newDept, oldDept],
  })
  if (result.rowsAffected > 0) {
    console.log(`  ✓ ${oldDept} -> ${newDept} (${result.rowsAffected} rows)`)
    updated += result.rowsAffected
  }
}

console.log(`\nDone. ${updated} row(s) updated.`)
