/**
 * Seeds dummy job referrals across companies and departments.
 * Run: & "C:\Program Files\nodejs\node.exe" --env-file=.env.local scripts/seed-referrals.mjs
 */

import { createClient } from "@libsql/client"

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const USERS = [
  "cmqaeu6ar000046rkynd9itly", "cmqz9yf960009rzhoobuky0rl", "cmrhyv3ms0001973xteal5h5w",
  "cmri121jb000642qxo71ptaix", "cmrrz9vrk000e74czpokw0282", "cmrt18o0700019pf92v6ozm8s",
]
const COMPANIES = [
  "cmqadgzdu0000ykuljxb0y077", "cmqdnae8z000w6rxzonrxr9tw", "cmqdnjsft00166rxzuou0m0y6",
  "cmqz9yfmb000brzhoqboqs59n", "effa5d07f97fda55f9f0334d", "b539365406776f2ca46beffd",
  "714a94b7acbc3a0042c8b077", "813720d4fb5d674a4dbd8d99",
]
const CITIES = ["Bengaluru", "Chennai", "Mumbai", "Pune", "Hyderabad", "Delhi"]

function id()      { return "ref_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function j(v)      { return JSON.stringify(v) }

const REFERRALS = [
  { title: "Senior Frontend Engineer — React", department: "Engineering", experienceMin: 4, experienceMax: 8, salaryMin: 2200000, salaryMax: 3400000, jobType: "FULL_TIME", workMode: "HYBRID", skills: j(["React", "TypeScript", "Next.js"]), referralBonus: 50000, description: "Own the frontend architecture for our flagship product. Strong React + TypeScript experience required, Next.js a big plus." },
  { title: "Backend Engineer — Node.js & Postgres", department: "Engineering", experienceMin: 3, experienceMax: 6, salaryMin: 1800000, salaryMax: 2800000, jobType: "FULL_TIME", workMode: "ONSITE", skills: j(["Node.js", "PostgreSQL", "AWS"]), referralBonus: 40000, description: "Build and scale our core APIs. Experience with distributed systems and Postgres query optimization is a must." },
  { title: "DevOps Engineer — Kubernetes & CI/CD", department: "Engineering", experienceMin: 3, experienceMax: 7, salaryMin: 2000000, salaryMax: 3000000, jobType: "FULL_TIME", workMode: "REMOTE", skills: j(["Kubernetes", "Docker", "Terraform"]), referralBonus: 45000, description: "Own our cloud infrastructure and deployment pipelines across multiple environments." },
  { title: "Data Scientist — ML & Analytics", department: "Data", experienceMin: 2, experienceMax: 5, salaryMin: 1600000, salaryMax: 2600000, jobType: "FULL_TIME", workMode: "HYBRID", skills: j(["Python", "SQL", "Machine Learning"]), referralBonus: 35000, description: "Work on churn prediction and recommendation models powering our core product." },
  { title: "Product Manager — Growth", department: "Product", experienceMin: 4, experienceMax: 8, salaryMin: 2500000, salaryMax: 4000000, jobType: "FULL_TIME", workMode: "HYBRID", skills: j(["Product Strategy", "Analytics", "A/B Testing"]), referralBonus: 60000, description: "Drive user acquisition and retention initiatives across our consumer app." },
  { title: "UX Designer — Mobile Apps", department: "Design", experienceMin: 2, experienceMax: 5, salaryMin: 1200000, salaryMax: 2000000, jobType: "FULL_TIME", workMode: "ONSITE", skills: j(["Figma", "User Research", "Prototyping"]), referralBonus: 30000, description: "Design intuitive mobile experiences for millions of users. Portfolio review required." },
  { title: "Engineering Manager — Platform Team", department: "Engineering", experienceMin: 7, experienceMax: 12, salaryMin: 4000000, salaryMax: 6000000, jobType: "FULL_TIME", workMode: "HYBRID", skills: j(["Leadership", "System Design", "Java"]), referralBonus: 80000, description: "Lead a team of 8 engineers building our core platform services. People management experience essential." },
  { title: "QA Automation Engineer", department: "Engineering", experienceMin: 2, experienceMax: 5, salaryMin: 1000000, salaryMax: 1800000, jobType: "FULL_TIME", workMode: "ONSITE", skills: j(["Selenium", "Cypress", "API Testing"]), referralBonus: 25000, description: "Build and maintain our automated test suites across web and mobile platforms." },
  { title: "Digital Marketing Manager", department: "Marketing", experienceMin: 3, experienceMax: 7, salaryMin: 1400000, salaryMax: 2200000, jobType: "FULL_TIME", workMode: "HYBRID", skills: j(["SEO", "Performance Marketing", "Analytics"]), referralBonus: 30000, description: "Own our paid and organic acquisition channels across search, social, and content." },
  { title: "Sales Development Representative", department: "Sales", experienceMin: 1, experienceMax: 3, salaryMin: 700000, salaryMax: 1200000, jobType: "FULL_TIME", workMode: "ONSITE", skills: j(["CRM", "Cold Outreach", "Negotiation"]), referralBonus: 20000, description: "Generate and qualify leads for our enterprise sales pipeline. Great entry point into B2B sales." },
  { title: "Business Analyst — Finance", department: "Finance", experienceMin: 2, experienceMax: 5, salaryMin: 1100000, salaryMax: 1800000, jobType: "FULL_TIME", workMode: "ONSITE", skills: j(["Excel", "SQL", "Financial Modeling"]), referralBonus: 25000, description: "Support budgeting, forecasting, and financial reporting for the leadership team." },
  { title: "HR Business Partner", department: "HR", experienceMin: 4, experienceMax: 8, salaryMin: 1500000, salaryMax: 2400000, jobType: "FULL_TIME", workMode: "HYBRID", skills: j(["Employee Relations", "Talent Management"]), referralBonus: 30000, description: "Partner with engineering leadership on org design, performance, and culture initiatives." },
  { title: "Legal Counsel — Contracts", department: "Legal", experienceMin: 3, experienceMax: 7, salaryMin: 1800000, salaryMax: 2800000, jobType: "FULL_TIME", workMode: "ONSITE", skills: j(["Contract Law", "Compliance"]), referralBonus: 35000, description: "Draft and negotiate commercial contracts, vendor agreements, and partnership deals." },
  { title: "iOS Developer — Swift", department: "Engineering", experienceMin: 3, experienceMax: 6, salaryMin: 1800000, salaryMax: 2800000, jobType: "FULL_TIME", workMode: "HYBRID", skills: j(["Swift", "SwiftUI", "iOS"]), referralBonus: 40000, description: "Build native iOS experiences for our consumer app used by millions daily." },
  { title: "Technical Content Writer", department: "Marketing", experienceMin: 1, experienceMax: 4, salaryMin: 800000, salaryMax: 1400000, jobType: "CONTRACT", workMode: "REMOTE", skills: j(["Technical Writing", "SEO"]), referralBonus: 15000, description: "Write developer-facing documentation, blog posts, and technical guides." },
  { title: "Summer Internship — Software Engineering", department: "Engineering", experienceMin: 0, experienceMax: 1, salaryMin: null, salaryMax: null, jobType: "INTERNSHIP", workMode: "ONSITE", skills: j(["Data Structures", "Any Language"]), referralBonus: null, description: "3-month internship for pre-final year students. Stipend + PPO opportunity for top performers." },
]

console.log(`Seeding ${REFERRALS.length} job referrals…\n`)
let inserted = 0

for (const r of REFERRALS) {
  const rid = id()
  const now = new Date().toISOString()
  const userId    = pick(USERS)
  const companyId = pick(COMPANIES)
  try {
    await db.execute({
      sql: `INSERT INTO JobReferral (
        id, userId, companyId, title, description, department,
        experienceMin, experienceMax, salaryMin, salaryMax, skills,
        jobType, workMode, location, openings, referralBonus,
        status, isBoosted, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?, ?)`,
      args: [
        rid, userId, companyId, r.title, r.description, r.department,
        r.experienceMin, r.experienceMax, r.salaryMin ?? null, r.salaryMax ?? null, r.skills,
        r.jobType, r.workMode, pick(CITIES), 1 + Math.floor(Math.random() * 3), r.referralBonus ?? null,
        Math.random() < 0.2 ? 1 : 0,
        now, now,
      ],
    })
    console.log(`  ✓ [${r.department.padEnd(11)}] ${r.title.slice(0, 50)}`)
    inserted++
  } catch (err) {
    console.error(`  ✗ ${r.title.slice(0, 40)}: ${err.message}`)
  }
}

console.log(`\n✓ Done — ${inserted}/${REFERRALS.length} referrals seeded.\n`)
process.exit(0)
