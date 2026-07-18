/**
 * Seeds SkillListing rows so the new SkillHub (/skills) pages have real data to render.
 * Run: node --env-file=.env.local scripts/seed-skill-listings.mjs
 */

import { createClient } from "@libsql/client"

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function sid()     { return "skl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9) }
function j(v)      { return JSON.stringify(v) }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

const usersRes = await db.execute("SELECT id FROM User")
const USERS = usersRes.rows.map(r => r.id)
if (USERS.length === 0) {
  console.error("No users found — cannot seed listings without a userId to attach them to.")
  process.exit(1)
}

console.log(`Found ${USERS.length} users to attach listings to.`)

const LISTINGS = [
  // TECH
  { category: "TECH", title: "Full-Stack Web Development (React + Node.js)", tagline: "Production-grade web apps, end to end", skills: ["React", "Next.js", "TypeScript", "Prisma", "PostgreSQL", "AWS"], description: "End-to-end web apps — from Figma to production. Specialise in Next.js, Prisma, Postgres, and AWS. 5+ years, 30+ projects delivered.", pricingModel: "HOURLY", hourlyRate: 2500, format: "ONLINE", yearsExp: 5 },
  { category: "TECH", title: "iOS & Android App Development", tagline: "Native and cross-platform mobile apps", skills: ["Swift", "Kotlin", "React Native"], description: "Native and cross-platform mobile apps using Swift, Kotlin, and React Native. App Store + Play Store deployment included.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 6,
    packages: [ { name: "MVP App", price: 80000, durationHrs: 120, description: "Single-platform MVP", features: ["Up to 8 screens", "API integration", "App store submission"] }, { name: "Full App", price: 150000, durationHrs: 220, description: "iOS + Android", features: ["Up to 20 screens", "Push notifications", "Analytics", "2 rounds of revisions"] } ] },
  { category: "TECH", title: "DevOps & Cloud Infrastructure (AWS/GCP)", tagline: "CI/CD, Kubernetes, cost optimisation", skills: ["AWS", "Terraform", "Kubernetes", "Docker"], description: "CI/CD pipelines, Kubernetes, Terraform, cost optimisation. AWS Certified Solutions Architect. SLA-backed engagements.", pricingModel: "HOURLY", hourlyRate: 3500, format: "ONLINE", yearsExp: 8 },
  { category: "TECH", title: "AI/ML Model Development & Integration", tagline: "LLM pipelines, fine-tuning, RAG", skills: ["Python", "PyTorch", "LangChain", "HuggingFace"], description: "Custom LLM wrappers, fine-tuning, RAG pipelines, and ML model deployment.", pricingModel: "HOURLY", hourlyRate: 4000, format: "ONLINE", yearsExp: 4 },
  { category: "TECH", title: "Cybersecurity Audit & Penetration Testing", tagline: "OWASP Top 10 compliance, VAPT reports", skills: ["OWASP", "Burp Suite", "Nmap"], description: "VAPT for web apps, APIs, and internal networks. OWASP Top 10 compliance reports. CEH certified, 8 years in infosec.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 8,
    packages: [ { name: "Web App VAPT", price: 50000, durationHrs: 40, description: "Single application audit", features: ["Full OWASP Top 10 scan", "Manual pen-test", "Detailed report + fixes"] } ] },

  // DATA
  { category: "DATA", title: "Data Analytics & BI Dashboards (Power BI / Tableau)", tagline: "Custom dashboards, KPI tracking", skills: ["Power BI", "Tableau", "SQL"], description: "Custom dashboards, KPI tracking, and data storytelling. Connect any data source — SQL, Excel, GA4, Salesforce.", pricingModel: "HOURLY", hourlyRate: 3000, format: "ONLINE", yearsExp: 6 },
  { category: "DATA", title: "SQL & Python Data Wrangling", tagline: "ETL pipelines and automated reporting", skills: ["Python", "Pandas", "Airflow", "SQL"], description: "ETL pipelines, data cleaning, exploratory analysis, and automated reporting.", pricingModel: "HOURLY", hourlyRate: 2500, format: "ONLINE", yearsExp: 4 },
  { category: "DATA", title: "Market Research & Consumer Insights", tagline: "Surveys, focus groups, insight reports", skills: ["Survey Design", "SPSS", "Excel"], description: "Primary and secondary research, survey design, focus groups, and insight reports for product and marketing teams.", pricingModel: "PACKAGE", format: "BOTH", location: "Mumbai", yearsExp: 7,
    packages: [ { name: "Insight Report", price: 35000, durationHrs: 30, description: "Full research cycle", features: ["Survey design", "50+ respondents", "Insight deck"] } ] },

  // DESIGN
  { category: "DESIGN", title: "Brand Identity & Logo Design", tagline: "Logo, palette, typography, brand book", skills: ["Illustrator", "Figma", "Brand Strategy"], description: "Full brand kits — logo, palette, typography, brand book. Clients include D2C startups, SaaS companies, and F&B brands.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 6,
    packages: [ { name: "Starter Kit", price: 30000, durationHrs: 25, description: "Logo + basic guidelines", features: ["3 logo concepts", "Color palette", "Typography pairing"] }, { name: "Full Brand Kit", price: 55000, durationHrs: 45, description: "Complete brand system", features: ["Everything in Starter", "Brand book", "Social templates"] } ] },
  { category: "DESIGN", title: "UI/UX Design for Web & Mobile", tagline: "Figma-based product design", skills: ["Figma", "User Research", "Design Systems"], description: "Figma-based product design: user research, wireframes, high-fi prototypes, design systems. Previously at Swiggy & Razorpay.", pricingModel: "HOURLY", hourlyRate: 2000, format: "ONLINE", yearsExp: 6 },
  { category: "DESIGN", title: "Social Media & Content Design", tagline: "Instagram carousels, ad creatives", skills: ["Photoshop", "Canva", "After Effects"], description: "Instagram carousels, LinkedIn banners, reels thumbnails, ad creatives. Batch of 20 creatives/month.", pricingModel: "PACKAGE", format: "ONLINE", location: "Pune", yearsExp: 3,
    packages: [ { name: "Monthly Batch", price: 15000, durationHrs: 20, description: "20 creatives/month", features: ["20 designs", "2 revision rounds", "Brand-consistent templates"] } ] },
  { category: "DESIGN", title: "Motion Graphics & Video Editing", tagline: "Product demos, explainers, reels", skills: ["After Effects", "Premiere", "DaVinci Resolve"], description: "Product demos, explainer videos, social reels, and YouTube content.", pricingModel: "HOURLY", hourlyRate: 1500, format: "ONLINE", location: "Chennai", yearsExp: 4 },

  // ENGINEERING
  { category: "ENGINEERING", title: "Embedded Systems & IoT Firmware", tagline: "Firmware for connected hardware products", skills: ["C", "Embedded C", "RTOS", "Bluetooth LE"], description: "Firmware development for IoT devices — sensors, wearables, and industrial equipment. Low-power optimisation included.", pricingModel: "HOURLY", hourlyRate: 3000, format: "ONLINE", yearsExp: 7 },
  { category: "ENGINEERING", title: "Mechanical CAD & Product Design", tagline: "SolidWorks / AutoCAD product design", skills: ["SolidWorks", "AutoCAD", "DFM"], description: "3D modelling, prototyping support, and design-for-manufacture reviews for hardware products.", pricingModel: "HOURLY", hourlyRate: 2200, format: "BOTH", location: "Pune", yearsExp: 9 },

  // MARKETING
  { category: "MARKETING", title: "Performance Marketing (Meta & Google Ads)", tagline: "Full-funnel paid campaigns", skills: ["Meta Ads", "Google Ads", "A/B Testing"], description: "Full-funnel paid campaigns — creatives, targeting, A/B testing, and optimisation. ₹5Cr+ ad spend managed.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 5,
    packages: [ { name: "Growth Retainer", price: 30000, durationHrs: 40, description: "Monthly campaign management", features: ["Campaign setup", "Weekly optimisation", "Monthly report"] } ] },
  { category: "MARKETING", title: "Content Marketing & SEO", tagline: "Blogs, SEO audits, backlink strategy", skills: ["SEO", "Content Strategy", "Ahrefs"], description: "Long-form blogs, SEO audits, keyword research, and backlink strategy. 3x organic traffic growth for 10+ brands.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 4,
    packages: [ { name: "SEO Sprint", price: 20000, durationHrs: 25, description: "Audit + 4 articles", features: ["Full SEO audit", "4 optimised articles", "Keyword map"] } ] },
  { category: "MARKETING", title: "LinkedIn Personal Branding & Growth", tagline: "Ghostwriting and growth strategy", skills: ["Copywriting", "LinkedIn Strategy"], description: "Profile optimisation, content strategy, ghostwriting, and community engagement. 10K+ followers built for 5 founders.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 3,
    packages: [ { name: "Monthly Ghostwriting", price: 15000, durationHrs: 15, description: "12 posts/month", features: ["12 posts", "Content calendar", "Engagement guidance"] } ] },

  // BUSINESS
  { category: "BUSINESS", title: "Business Strategy & Growth Consulting", tagline: "GTM strategy and market entry", skills: ["Strategy", "Market Research", "OKRs"], description: "GTM strategy, market entry, competitive analysis, and OKR setup. Ex-McKinsey, worked with 50+ companies across India.", pricingModel: "HOURLY", hourlyRate: 8000, format: "ONLINE", yearsExp: 10 },
  { category: "BUSINESS", title: "Product Management Consulting", tagline: "Roadmaps, PRDs, sprint planning", skills: ["Product Strategy", "Roadmapping", "Agile"], description: "Product roadmap, PRD writing, sprint planning, and stakeholder alignment. 8 years PM across Flipkart and CRED.", pricingModel: "HOURLY", hourlyRate: 6000, format: "ONLINE", yearsExp: 8 },
  { category: "BUSINESS", title: "HR & Talent Acquisition Consulting", tagline: "Full-cycle recruiting for startups", skills: ["Recruiting", "Compensation Design"], description: "Full-cycle recruiting, JD writing, compensation benchmarking, and culture assessments for startups scaling 0→100.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 6,
    packages: [ { name: "Single Hire", price: 40000, durationHrs: 30, description: "End-to-end hiring for 1 role", features: ["JD + sourcing", "Screening", "Offer negotiation support"] } ] },

  // FINANCE
  { category: "FINANCE", title: "Income Tax Filing & Planning (Individuals)", tagline: "ITR filing for salaried and NRIs", skills: ["Tax Planning", "ITR Filing"], description: "ITR filing for salaried, freelancers, and NRIs. Capital gains, RSU taxation, foreign income. CA with 10 years experience.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 10,
    packages: [ { name: "Salaried ITR", price: 3000, durationHrs: 3, description: "Single ITR filing", features: ["Form 16 review", "Deduction optimisation", "E-filing"] } ] },
  { category: "FINANCE", title: "Startup Financial Modelling & CFO Services", tagline: "3-statement models and fundraising decks", skills: ["Financial Modelling", "Fundraising"], description: "3-statement models, unit economics, fundraising decks, board reporting. Part-time CFO for seed/Series A startups.", pricingModel: "HOURLY", hourlyRate: 5000, format: "ONLINE", yearsExp: 9 },
  { category: "FINANCE", title: "Personal Investment Advisory (MF, Stocks, NPS)", tagline: "SEBI-registered, no commissions", skills: ["Portfolio Review", "Goal Planning"], description: "SEBI-registered investment advisor. Personalised portfolio review, goal-based planning, risk profiling.", pricingModel: "PACKAGE", format: "ONLINE", location: "Mumbai", yearsExp: 8,
    packages: [ { name: "Portfolio Review", price: 5000, durationHrs: 4, description: "Full portfolio audit", features: ["Risk profiling", "Goal-based plan", "1 follow-up session"] } ] },

  // LEGAL
  { category: "LEGAL", title: "Startup Legal Setup (Company Registration & MOA)", tagline: "Incorporation and compliance", skills: ["Company Law", "Compliance"], description: "Private limited company registration, MOA/AOA drafting, DIR-3 KYC, and bank account setup.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 8,
    packages: [ { name: "Full Incorporation", price: 12000, durationHrs: 15, description: "End-to-end registration", features: ["MOA/AOA drafting", "MCA filing", "Bank account setup support"] } ] },
  { category: "LEGAL", title: "Contract Drafting & Review", tagline: "Employment, vendor, SaaS agreements", skills: ["Contract Law", "Drafting"], description: "Employment agreements, vendor contracts, NDAs, SaaS terms, and founder agreements. Advocate with 8 years corporate practice.", pricingModel: "PACKAGE", format: "ONLINE", yearsExp: 8,
    packages: [ { name: "Single Contract", price: 5000, durationHrs: 5, description: "One contract drafted/reviewed", features: ["Custom drafting", "1 revision round"] } ] },
  { category: "LEGAL", title: "IP & Trademark Registration", tagline: "Trademark filing and IP strategy", skills: ["IP Law", "Trademark Filing"], description: "Trademark filing, IP strategy, copyright registration, and patent searches. 300+ trademarks filed.", pricingModel: "PACKAGE", format: "ONLINE", location: "Mumbai", yearsExp: 10,
    packages: [ { name: "Trademark Filing", price: 8000, durationHrs: 6, description: "Single class filing", features: ["Trademark search", "Application filing", "Status tracking"] } ] },

  // LANGUAGE
  { category: "LANGUAGE", title: "Business English & Communication Coaching", tagline: "Fluency and workplace communication", skills: ["English", "Public Speaking"], description: "1:1 spoken English and business communication coaching for working professionals. Accent neutralisation available.", pricingModel: "HOURLY", hourlyRate: 1200, format: "ONLINE", yearsExp: 5 },
  { category: "LANGUAGE", title: "German Language Lessons (A1–B2)", tagline: "Goethe-exam focused coaching", skills: ["German", "Goethe Exam Prep"], description: "Structured German lessons for beginners to intermediate, exam-focused for Goethe certification.", pricingModel: "HOURLY", hourlyRate: 900, format: "ONLINE", yearsExp: 4 },

  // COACHING
  { category: "COACHING", title: "Executive & Leadership Coaching", tagline: "1:1 coaching for senior managers", skills: ["Leadership", "Communication"], description: "1:1 coaching for senior managers and founders. Focus on communication, decision-making, and stakeholder influence. ICF-certified.", pricingModel: "HOURLY", hourlyRate: 7000, format: "ONLINE", yearsExp: 12 },
  { category: "COACHING", title: "Interview & FAANG Prep Coaching", tagline: "DSA, system design, behavioural rounds", skills: ["DSA", "System Design", "Mock Interviews"], description: "Mock interviews, DSA, system design, and behavioural rounds. 90% success rate. Ex-Google interviewer.", pricingModel: "HOURLY", hourlyRate: 4000, format: "ONLINE", yearsExp: 6 },
  { category: "COACHING", title: "Public Speaking & Communication Coach", tagline: "From presentation fear to confident speaker", skills: ["Public Speaking", "Storytelling"], description: "From presentation fear to confident speaker in 4 sessions. Group workshops and 1:1. TEDx speaker & trainer.", pricingModel: "PACKAGE", format: "BOTH", location: "Mumbai", yearsExp: 7,
    packages: [ { name: "4-Session Programme", price: 12000, durationHrs: 8, description: "Structured 4-week coaching", features: ["4 x 1:1 sessions", "Practice recordings reviewed"] } ] },

  // CREATIVE
  { category: "CREATIVE", title: "Corporate Event & Conference Photography", tagline: "Full-day event coverage, RAW files included", skills: ["Photography", "Lightroom"], description: "Professional event photography for conferences, product launches, and team offsites. 2-day delivery.", pricingModel: "PACKAGE", format: "IN_PERSON", yearsExp: 6,
    packages: [ { name: "Full-Day Coverage", price: 20000, durationHrs: 8, description: "One full day, 2 photographers", features: ["300+ edited photos", "RAW files included", "48-hour delivery"] } ] },
  { category: "CREATIVE", title: "LinkedIn & Personal Branding Portraits", tagline: "Studio or location headshots", skills: ["Portrait Photography", "Retouching"], description: "Professional headshots and brand portraits. Studio or location shoots. Includes basic retouching.", pricingModel: "PACKAGE", format: "IN_PERSON", yearsExp: 5,
    packages: [ { name: "Headshot Session", price: 5000, durationHrs: 2, description: "1-hour studio session", features: ["15 edited photos", "2 outfit changes"] } ] },
  { category: "CREATIVE", title: "Freelance Copywriting & Scriptwriting", tagline: "Ad scripts, brand voice, UX copy", skills: ["Copywriting", "Scriptwriting"], description: "Ad scripts, website and product copy, brand voice guidelines for startups and D2C brands.", pricingModel: "HOURLY", hourlyRate: 1800, format: "ONLINE", yearsExp: 5 },

  // WELLNESS
  { category: "WELLNESS", title: "Personal Training & Fitness Coaching", tagline: "Home/gym training, online coaching available", skills: ["Strength Training", "Nutrition Basics"], description: "Home/gym personal training tailored to your goals — fat loss, muscle gain, or endurance. Online coaching available.", pricingModel: "HOURLY", hourlyRate: 1500, format: "BOTH", yearsExp: 6 },
  { category: "WELLNESS", title: "Certified Yoga Instructor (Private Sessions)", tagline: "Hatha, Vinyasa, and Yin yoga", skills: ["Hatha Yoga", "Vinyasa", "Corporate Wellness"], description: "Hatha, Vinyasa, and Yin yoga. Corporate wellness sessions and private 1:1. AYUSH-certified, 7 years experience.", pricingModel: "HOURLY", hourlyRate: 1000, format: "BOTH", yearsExp: 7 },
  { category: "WELLNESS", title: "Nutritionist & Diet Planning", tagline: "Personalised meal plans, gut health counselling", skills: ["Meal Planning", "Macro Tracking"], description: "Personalised meal plans, macro tracking, and gut health counselling. RD-certified. 3-month transformation programmes.", pricingModel: "PACKAGE", format: "ONLINE", location: "Mumbai", yearsExp: 5,
    packages: [ { name: "3-Month Programme", price: 8000, durationHrs: 6, description: "Full transformation programme", features: ["Custom meal plan", "Bi-weekly check-ins", "WhatsApp support"] } ] },
]

console.log("\n── Seeding SkillListings ──")

let seeded = 0
for (const [i, l] of LISTINGS.entries()) {
  const now = new Date(Date.now() - rand(0, 90) * 86400000).toISOString()
  const reviewCount     = rand(0, 60)
  const avgRating       = reviewCount > 0 ? +(3.9 + Math.random() * 1.1).toFixed(1) : null
  const totalOrders     = reviewCount + rand(0, 15)
  const completedOrders = Math.max(reviewCount, Math.round(totalOrders * (0.8 + Math.random() * 0.2)))
  const isFeatured      = i % 6 === 0
  const isVerified      = Math.random() > 0.15

  await db.execute({
    sql: `INSERT INTO SkillListing (
      id, userId, title, tagline, category, subcategory, skills, description, deliverables, requirements, faqs,
      pricingModel, hourlyRate, packages, format, location, timezone, availability, maxClientsPerMonth,
      yearsExp, certifications, portfolioUrl, linkedIn,
      totalOrders, completedOrders, avgRating, reviewCount, responseTimeMins,
      status, isFeatured, isVerified, viewCount, createdAt, updatedAt
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?, ?,?,?,?,?,?,?,?, ?,?,?,?, ?,?,?,?,?, ?,?,?,?,?,?)`,
    args: [
      sid(), pick(USERS), l.title, l.tagline ?? null, l.category, null, j(l.skills ?? []), l.description, j([]), null, null,
      l.pricingModel, l.hourlyRate ?? null, l.packages ? j(l.packages) : null, l.format, l.location ?? null, "Asia/Kolkata", null, null,
      l.yearsExp ?? null, j([]), null, null,
      totalOrders, completedOrders, avgRating, reviewCount, rand(15, 240),
      "ACTIVE", isFeatured ? 1 : 0, isVerified ? 1 : 0, rand(20, 900), now, now,
    ],
  })
  seeded++
  console.log(`  ✓ [${l.category.padEnd(11)}] ${l.title.slice(0, 55)}`)
}

console.log(`\n── Done ──`)
console.log(`Skill listings seeded: ${seeded}/${LISTINGS.length}`)

const finalCount = await db.execute("SELECT COUNT(*) as c FROM SkillListing WHERE status = 'ACTIVE'")
console.log(`Active SkillListings in DB: ${finalCount.rows[0].c}`)
