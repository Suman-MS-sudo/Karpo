/**
 * Seeds Services and fixes Events (adds onlineLink to some, fills missing agendas)
 * Run: & "C:\Program Files\nodejs\node.exe" --env-file=.env.local scripts/seed-services-and-fix-events.mjs
 */

import { createClient } from "@libsql/client"

const db = createClient({
  url:       process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const USERS = [
  "cmqaegcjk0000nwuwz3kvohry",  // Suman
  "cmqaeng0b0006nwuwf7llpxir",  // Lyra
  "cmqdnhj9400116rxzwymg32l3",  // Charan Kumar
  "cmqcc7h6r00161098rlza1iiz",  // Charan
  "cmqaeu6ar000046rkynd9itly",  // Admin
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function sid()     { return "svc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9) }
function j(v)      { return JSON.stringify(v) }

// ── 1. Fix Events: set onlineLink for tech/wellness/workshop events ────────────

console.log("\n── Fixing Events: adding online links to relevant events ──")

const onlineKeywords = ["Workshop", "Hackathon", "Deep Dive", "DevTalks", "Bootcamp", "Mental Health", "Breathwork", "Screenplay", "Marathon Training", "Training Programme"]

const events = await db.execute("SELECT id, title, category FROM Event")
let onlineFixed = 0
for (const ev of events.rows) {
  const shouldBeOnline = onlineKeywords.some(k => ev.title.includes(k)) ||
    (ev.category === "TECH" && Math.random() > 0.3) ||
    (ev.category === "WELLNESS" && Math.random() > 0.5)

  if (shouldBeOnline) {
    await db.execute({
      sql:  "UPDATE Event SET onlineLink = ? WHERE id = ?",
      args: ["https://meet.google.com/korpo-" + ev.id.slice(-6), ev.id],
    })
    onlineFixed++
    console.log("  ✓ Online:", ev.title.slice(0, 50))
  }
}
console.log(`  → ${onlineFixed} events marked as online\n`)

// ── 2. Fix Events: add agenda to events missing it ─────────────────────────────

console.log("── Fixing Events: filling missing agendas ──")

const AGENDAS = {
  TREK: j([
    { time: "5:00 AM", title: "Assembly point & headcount", speaker: "" },
    { time: "5:30 AM", title: "Trek begins", speaker: "" },
    { time: "8:30 AM", title: "Summit / midpoint rest", speaker: "" },
    { time: "9:00 AM", title: "Breakfast & photography", speaker: "" },
    { time: "11:00 AM", title: "Descent begins", speaker: "" },
    { time: "1:00 PM", title: "Return & disperse", speaker: "" },
  ]),
  SPORTS: j([
    { time: "7:00 AM", title: "Warm-up & team registration", speaker: "" },
    { time: "7:30 AM", title: "Match 1 (Group stage)", speaker: "" },
    { time: "9:00 AM", title: "Match 2", speaker: "" },
    { time: "10:30 AM", title: "Semi-finals", speaker: "" },
    { time: "12:00 PM", title: "Finals & prize distribution", speaker: "" },
  ]),
  MUSIC: j([
    { time: "6:30 PM", title: "Doors open", speaker: "" },
    { time: "7:00 PM", title: "Opening act", speaker: "Local artist" },
    { time: "7:45 PM", title: "Main performance", speaker: "Headliner" },
    { time: "9:00 PM", title: "Encore & close", speaker: "" },
  ]),
  COMEDY: j([
    { time: "7:00 PM", title: "Doors open & seating", speaker: "" },
    { time: "7:30 PM", title: "Host & warm-up comic", speaker: "MC" },
    { time: "8:00 PM", title: "Feature comics (3 sets)", speaker: "Various" },
    { time: "9:00 PM", title: "Headliner set", speaker: "Headliner" },
    { time: "9:45 PM", title: "Open mic round (sign-ups at door)", speaker: "" },
  ]),
  FOOD: j([
    { time: "7:00 PM", title: "Welcome drinks & canapés", speaker: "" },
    { time: "7:30 PM", title: "First course", speaker: "" },
    { time: "8:00 PM", title: "Main course", speaker: "" },
    { time: "8:45 PM", title: "Dessert & drinks", speaker: "" },
    { time: "9:15 PM", title: "Chef Q&A", speaker: "Chef" },
  ]),
  WELLNESS: j([
    { time: "6:30 AM", title: "Welcome & intention setting", speaker: "" },
    { time: "6:45 AM", title: "Breathwork session", speaker: "Facilitator" },
    { time: "7:15 AM", title: "Yoga / movement practice", speaker: "Instructor" },
    { time: "8:00 AM", title: "Guided meditation", speaker: "" },
    { time: "8:30 AM", title: "Healthy breakfast & sharing circle", speaker: "" },
  ]),
  WORKSHOP: j([
    { time: "10:00 AM", title: "Introduction & materials", speaker: "Host" },
    { time: "10:30 AM", title: "Technique demo", speaker: "Expert" },
    { time: "11:00 AM", title: "Hands-on practice", speaker: "" },
    { time: "12:30 PM", title: "Lunch break", speaker: "" },
    { time: "1:30 PM", title: "Advanced session", speaker: "" },
    { time: "3:00 PM", title: "Show & tell + Q&A", speaker: "" },
  ]),
  GAMING: j([
    { time: "2:00 PM", title: "Registration & hardware check", speaker: "" },
    { time: "2:30 PM", title: "Group stage matches", speaker: "" },
    { time: "5:00 PM", title: "Quarter-finals", speaker: "" },
    { time: "6:30 PM", title: "Semi-finals", speaker: "" },
    { time: "7:30 PM", title: "Grand final & prize ceremony", speaker: "" },
  ]),
  MOVIE: j([
    { time: "6:30 PM", title: "Doors open & popcorn bar", speaker: "" },
    { time: "7:00 PM", title: "Introduction to the film", speaker: "Host" },
    { time: "7:15 PM", title: "Screening begins", speaker: "" },
    { time: "9:30 PM", title: "Post-film discussion", speaker: "" },
  ]),
  FITNESS: j([
    { time: "6:00 AM", title: "Registration & warm-up", speaker: "" },
    { time: "6:30 AM", title: "Race briefing", speaker: "Organiser" },
    { time: "6:45 AM", title: "Start gun", speaker: "" },
    { time: "8:00 AM", title: "Finishers' zone: medals & photos", speaker: "" },
    { time: "8:30 AM", title: "Prize giving", speaker: "" },
  ]),
  HOBBY: j([
    { time: "9:30 AM", title: "Welcome & material distribution", speaker: "" },
    { time: "10:00 AM", title: "Skill demo by instructor", speaker: "Instructor" },
    { time: "10:30 AM", title: "Guided practice", speaker: "" },
    { time: "12:00 PM", title: "Showcase & community feedback", speaker: "" },
  ]),
  TRAVEL: j([
    { time: "Day 1 6:00 AM", title: "Departure from Bengaluru", speaker: "" },
    { time: "Day 1 Noon", title: "Arrival & check-in", speaker: "" },
    { time: "Day 1 Eve", title: "Sunset activity & bonfire", speaker: "" },
    { time: "Day 2", title: "Main sightseeing / trek / activity", speaker: "" },
    { time: "Day 3", title: "Return journey", speaker: "" },
  ]),
  OTHER: j([
    { time: "10:00 AM", title: "Kick-off & briefing", speaker: "" },
    { time: "10:30 AM", title: "Main activity", speaker: "" },
    { time: "1:00 PM", title: "Lunch", speaker: "" },
    { time: "2:00 PM", title: "Wrap-up & feedback", speaker: "" },
  ]),
}

const noAgenda = await db.execute("SELECT id, category FROM Event WHERE agenda IS NULL")
let agendaFixed = 0
for (const ev of noAgenda.rows) {
  const agenda = AGENDAS[ev.category] ?? AGENDAS.OTHER
  await db.execute({ sql: "UPDATE Event SET agenda = ? WHERE id = ?", args: [agenda, ev.id] })
  agendaFixed++
}
console.log(`  → ${agendaFixed} events filled with agenda\n`)

// ── 3. Seed Services ───────────────────────────────────────────────────────────

console.log("── Seeding Services ──")

// Delete old services first
await db.execute("DELETE FROM ServicePost")

const SERVICES = [

  // TECH (6)
  { category: "TECH", title: "Full-Stack Web Development (React + Node.js)", description: "End-to-end web apps — from Figma to production. Specialise in Next.js, Prisma, Postgres, and AWS. 5+ years, 30+ projects delivered.", priceType: "HOURLY", price: 2500, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80"]) },
  { category: "TECH", title: "iOS & Android App Development", description: "Native and cross-platform mobile apps using Swift, Kotlin, and React Native. App Store + Play Store deployment included.", priceType: "FIXED", price: 80000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80"]) },
  { category: "TECH", title: "DevOps & Cloud Infrastructure (AWS/GCP)", description: "CI/CD pipelines, Kubernetes, Terraform, cost optimisation. AWS Certified Solutions Architect. SLA-backed engagements.", priceType: "HOURLY", price: 3500, city: "Hyderabad", portfolio: j(["https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&q=80"]) },
  { category: "TECH", title: "AI/ML Model Development & Integration", description: "Custom LLM wrappers, fine-tuning, RAG pipelines, and ML model deployment. Python, PyTorch, HuggingFace, LangChain.", priceType: "NEGOTIABLE", price: null, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80"]) },
  { category: "TECH", title: "Cybersecurity Audit & Penetration Testing", description: "VAPT for web apps, APIs, and internal networks. OWASP Top 10 compliance reports. CEH certified, 8 years in infosec.", priceType: "FIXED", price: 50000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80"]) },
  { category: "TECH", title: "WordPress & Webflow Website Development", description: "Fast, SEO-optimised websites for SMBs and startups. Custom themes, WooCommerce, and Webflow CMS. Turnaround: 7 days.", priceType: "FIXED", price: 25000, city: "Mumbai", portfolio: j(["https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80"]) },

  // DESIGN (5)
  { category: "DESIGN", title: "Brand Identity & Logo Design", description: "Full brand kits — logo, palette, typography, brand book. Clients include D2C startups, SaaS companies, and F&B brands.", priceType: "FIXED", price: 30000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80"]) },
  { category: "DESIGN", title: "UI/UX Design for Web & Mobile", description: "Figma-based product design: user research, wireframes, high-fi prototypes, design systems. Previously at Swiggy & Razorpay.", priceType: "HOURLY", price: 2000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&q=80"]) },
  { category: "DESIGN", title: "Social Media & Content Design", description: "Instagram carousels, LinkedIn banners, reels thumbnails, ad creatives. Batch of 20 creatives/month. Fast TAT.", priceType: "FIXED", price: 15000, city: "Pune", portfolio: j(["https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80"]) },
  { category: "DESIGN", title: "Pitch Deck & Presentation Design", description: "Investor-grade pitch decks, board presentations, and sales decks. 60+ decks designed, ₹50Cr+ raised by clients.", priceType: "FIXED", price: 20000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80"]) },
  { category: "DESIGN", title: "Motion Graphics & Video Editing", description: "Product demos, explainer videos, social reels, and YouTube content. After Effects, Premiere, DaVinci Resolve.", priceType: "HOURLY", price: 1500, city: "Chennai", portfolio: j(["https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&q=80"]) },

  // FINANCE (4)
  { category: "FINANCE", title: "Income Tax Filing & Planning (Individuals)", description: "ITR filing for salaried, freelancers, and NRIs. Capital gains, RSU taxation, foreign income. CA with 10 years experience.", priceType: "FIXED", price: 3000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80"]) },
  { category: "FINANCE", title: "Startup Financial Modelling & CFO Services", description: "3-statement models, unit economics, fundraising decks, board reporting. Part-time CFO for seed/Series A startups.", priceType: "HOURLY", price: 5000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"]) },
  { category: "FINANCE", title: "Personal Investment Advisory (MF, Stocks, NPS)", description: "SEBI-registered investment advisor. Personalised portfolio review, goal-based planning, risk profiling. No commissions.", priceType: "FIXED", price: 5000, city: "Mumbai", portfolio: j(["https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80"]) },
  { category: "FINANCE", title: "GST Registration & Compliance", description: "GST registration, monthly/quarterly filing, reconciliation, and audit support. 200+ businesses served.", priceType: "FIXED", price: 2500, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"]) },

  // BUSINESS (4)
  { category: "BUSINESS", title: "Business Strategy & Growth Consulting", description: "GTM strategy, market entry, competitive analysis, and OKR setup. Ex-McKinsey, worked with 50+ companies across India.", priceType: "HOURLY", price: 8000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"]) },
  { category: "BUSINESS", title: "Operations & Process Optimisation", description: "SOP creation, workflow automation, vendor management, and cost reduction. Lean Six Sigma Black Belt certified.", priceType: "NEGOTIABLE", price: null, city: "Hyderabad", portfolio: j(["https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=800&q=80"]) },
  { category: "BUSINESS", title: "Product Management Consulting", description: "Product roadmap, PRD writing, sprint planning, and stakeholder alignment. 8 years PM across Flipkart and CRED.", priceType: "HOURLY", price: 6000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"]) },
  { category: "BUSINESS", title: "HR & Talent Acquisition Consulting", description: "Full-cycle recruiting, JD writing, compensation benchmarking, and culture assessments for startups scaling 0→100.", priceType: "FIXED", price: 40000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80"]) },

  // COACHING (4)
  { category: "COACHING", title: "Executive & Leadership Coaching", description: "1:1 coaching for senior managers and founders. Focus on communication, decision-making, and stakeholder influence. ICF-certified.", priceType: "HOURLY", price: 7000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80"]) },
  { category: "COACHING", title: "Career Transition Coaching (Tech to Management)", description: "Structured 8-week programme for engineers transitioning to product/management. Resume, interview prep, and negotiation.", priceType: "FIXED", price: 25000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"]) },
  { category: "COACHING", title: "Interview & FAANG Prep Coaching", description: "Mock interviews, DSA, system design, and behavioural rounds. 90% success rate. Ex-Google interviewer.", priceType: "HOURLY", price: 4000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80"]) },
  { category: "COACHING", title: "Public Speaking & Communication Coach", description: "From presentation fear to confident speaker in 4 sessions. Group workshops and 1:1. TEDx speaker & trainer.", priceType: "FIXED", price: 12000, city: "Mumbai", portfolio: j(["https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80"]) },

  // PHOTOGRAPHY (3)
  { category: "PHOTOGRAPHY", title: "Corporate Event & Conference Photography", description: "Professional event photography for conferences, product launches, and team offsites. 2-day delivery, RAW files included.", priceType: "FIXED", price: 20000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80"]) },
  { category: "PHOTOGRAPHY", title: "LinkedIn & Personal Branding Portraits", description: "Professional headshots and brand portraits. Studio or location shoots. Includes basic retouching. 15 edited photos.", priceType: "FIXED", price: 5000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1530268729831-4b0b9e170218?w=800&q=80"]) },
  { category: "PHOTOGRAPHY", title: "Product Photography for E-commerce", description: "White-background, lifestyle, and 360° product shots. Shoot 50 SKUs/day in studio. Post-processing included.", priceType: "FIXED", price: 300, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80"]) },

  // WELLNESS (3)
  { category: "WELLNESS", title: "Personal Training & Fitness Coaching", description: "Home/gym personal training tailored to your goals — fat loss, muscle gain, or endurance. Online coaching available.", priceType: "HOURLY", price: 1500, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80"]) },
  { category: "WELLNESS", title: "Certified Yoga Instructor (Private Sessions)", description: "Hatha, Vinyasa, and Yin yoga. Corporate wellness sessions and private 1:1. AYUSH-certified, 7 years experience.", priceType: "HOURLY", price: 1000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80"]) },
  { category: "WELLNESS", title: "Nutritionist & Diet Planning", description: "Personalised meal plans, macro tracking, and gut health counselling. RD-certified. 3-month transformation programmes.", priceType: "FIXED", price: 8000, city: "Mumbai", portfolio: j(["https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80"]) },

  // MARKETING (3)
  { category: "MARKETING", title: "Performance Marketing (Meta & Google Ads)", description: "Full-funnel paid campaigns — creatives, targeting, A/B testing, and optimisation. ₹5Cr+ ad spend managed.", priceType: "FIXED", price: 30000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&q=80"]) },
  { category: "MARKETING", title: "Content Marketing & SEO", description: "Long-form blogs, SEO audits, keyword research, and backlink strategy. 3x organic traffic growth for 10+ brands.", priceType: "FIXED", price: 20000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80"]) },
  { category: "MARKETING", title: "LinkedIn Personal Branding & Growth", description: "Profile optimisation, content strategy, ghostwriting, and community engagement. 10K+ followers built for 5 founders.", priceType: "FIXED", price: 15000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=800&q=80"]) },

  // DATA (3)
  { category: "DATA", title: "Data Analytics & Business Intelligence (Power BI / Tableau)", description: "Custom dashboards, KPI tracking, and data storytelling. Connect any data source — SQL, Excel, GA4, Salesforce.", priceType: "HOURLY", price: 3000, city: "Hyderabad", portfolio: j(["https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"]) },
  { category: "DATA", title: "SQL & Python Data Wrangling", description: "ETL pipelines, data cleaning, exploratory analysis, and automated reporting. Pandas, SQLAlchemy, Airflow.", priceType: "HOURLY", price: 2500, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&q=80"]) },
  { category: "DATA", title: "Market Research & Consumer Insights", description: "Primary and secondary research, survey design, focus groups, and insight reports for product and marketing teams.", priceType: "FIXED", price: 35000, city: "Mumbai", portfolio: j(["https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80"]) },

  // LEGAL (3)
  { category: "LEGAL", title: "Startup Legal Setup (Company Registration & MOA)", description: "Private limited company registration, MOA/AOA drafting, DIR-3 KYC, and bank account setup. All-inclusive package.", priceType: "FIXED", price: 12000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80"]) },
  { category: "LEGAL", title: "Contract Drafting & Review", description: "Employment agreements, vendor contracts, NDAs, SaaS terms, and founder agreements. Advocate with 8 years corporate practice.", priceType: "FIXED", price: 5000, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80"]) },
  { category: "LEGAL", title: "IP & Trademark Registration", description: "Trademark filing, IP strategy, copyright registration, and patent searches. 300+ trademarks filed across India and internationally.", priceType: "FIXED", price: 8000, city: "Mumbai", portfolio: j(["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"]) },

  // OTHER (2)
  { category: "OTHER", title: "Virtual Assistant & Executive Support", description: "Calendar management, inbox zero, travel bookings, research, and admin tasks. Full-time or part-time. NDA-ready.", priceType: "HOURLY", price: 500, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80"]) },
  { category: "OTHER", title: "Event Management & Corporate Offsites", description: "End-to-end event production — venue, catering, activities, A/V, and logistics. 150+ events across India.", priceType: "NEGOTIABLE", price: null, city: "Bengaluru", portfolio: j(["https://images.unsplash.com/photo-1519671282429-b44660ead0a7?w=800&q=80"]) },
]

let seeded = 0
for (const svc of SERVICES) {
  const now = new Date().toISOString()
  await db.execute({
    sql: `INSERT INTO ServicePost (id, userId, category, title, description, priceType, price, portfolio, city, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    args: [
      sid(),
      pick(USERS),
      svc.category,
      svc.title,
      svc.description,
      svc.priceType,
      svc.price,
      svc.portfolio,
      svc.city,
      now, now,
    ],
  })
  seeded++
  console.log(`  ✓ [${svc.category.padEnd(11)}] ${svc.title.slice(0, 55)}`)
}

console.log(`\n── Done ──`)
console.log(`Services seeded: ${seeded}/${SERVICES.length}`)

const finalCounts = await db.execute("SELECT COUNT(*) as c FROM ServicePost")
const eventCount  = await db.execute("SELECT COUNT(*) as c FROM Event WHERE onlineLink IS NOT NULL")
console.log(`Services in DB: ${finalCounts.rows[0].c}`)
console.log(`Online events:  ${eventCount.rows[0].c}`)
