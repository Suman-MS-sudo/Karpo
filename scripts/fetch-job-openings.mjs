/**
 * Fetches currently-open India job postings from companies' own public career
 * feeds and writes them to data/job-openings.json (rendered at /referrals/openings).
 *
 * Run: & "C:\Program Files\nodejs\node.exe" scripts/fetch-job-openings.mjs
 *
 * Sources are public, unauthenticated feeds only (Eightfold PCSX, Capgemini's
 * jobs feed, Greenhouse/Lever public boards). No login-walled sites, no
 * scraping of third-party job boards.
 */

import { writeFileSync, readFileSync, existsSync } from "node:fs"

const OUT = new URL("../data/job-openings.json", import.meta.url)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const UA = { "User-Agent": "Mozilla/5.0 (compatible; KorpoJobSync/1.0)" }

// Polite fetch: on 429 waits (honouring Retry-After) and retries a few times.
async function getJson(url) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: UA })
    if (res.status === 429) {
      const wait = Number(res.headers.get("retry-after")) * 1000 || 5000 * (attempt + 1)
      await sleep(wait)
      continue
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`)
    return res.json()
  }
  throw new Error(`429 (rate limited) ${url}`)
}

// Maps a raw title/team to Korpo's DEPARTMENTS (data/departments.ts).
function mapDepartment(text) {
  const t = text.toLowerCase()
  if (/\b(data scien|machine learning|\bml\b|\bai\b|analytics|data engineer|data analyst|gen ?ai)/.test(t)) return "Data & AI/ML"
  if (/\b(product manage|product owner|designer|\bux\b|\bui\b|design)/.test(t)) return "Product & Design"
  if (/\b(sales|business development|account executive|pre-?sales|partner)/.test(t)) return "Sales & Business Development"
  if (/\b(marketing|communications|brand|content|public relations)/.test(t)) return "Marketing & Communications"
  if (/\b(customer success|customer support|service desk|support engineer|customer service)/.test(t)) return "Customer Success & Support"
  if (/\b(financ|account(?!\s*manager)|audit|legal|counsel|tax|treasury|compliance)/.test(t)) return "Finance & Legal"
  if (/\b(human resources|\bhr\b|talent|recruit|people)/.test(t)) return "Human Resources"
  if (/\b(operation|strategy|program manager|project manager|supply chain|procurement|consult|business analyst)/.test(t)) return "Operations & Strategy"
  if (/\b(engineer|developer|software|devops|cloud|sap|java|\.net|python|qa|test|security|network|architect|sre|infrastructure|technology|technical|it\b|silicon|hardware|firmware|verification|embedded)/.test(t)) return "Engineering & IT"
  return "Other"
}

const WORK_MODE = { onsite: "ONSITE", hybrid: "HYBRID", remote: "REMOTE" }

// Eightfold PCSX — used by Microsoft and Qualcomm careers sites.
async function fetchEightfold({ company, domain, host, query = "", baseUrl }) {
  const jobs = []
  for (let start = 0; ; start += 10) {
    const q = `https://${host}/api/pcsx/search?domain=${domain}&query=${encodeURIComponent(query)}&location=India&start=${start}`
    const { data } = await getJson(q)
    if (!data.positions?.length) break
    for (const p of data.positions) {
      jobs.push({
        id: `${domain}-${p.id}`,
        company,
        companyDomain: domain,
        title: p.name,
        department: mapDepartment(`${p.name} ${p.department ?? ""}`),
        team: p.department || null,
        location: (p.standardizedLocations?.length ? p.standardizedLocations : p.locations ?? []).join("; ") || "India",
        workMode: WORK_MODE[p.workLocationOption] ?? null,
        jobType: /intern/i.test(p.name) ? "INTERNSHIP" : "FULL_TIME",
        postedAt: p.postedTs ? new Date(p.postedTs * 1000).toISOString() : null,
        applyUrl: `${baseUrl}${p.positionUrl}`,
        source: host,
      })
    }
    if (jobs.length >= (data.count ?? 0)) break
    await sleep(1200)
  }
  return jobs
}

async function fetchCapgemini() {
  const jobs = []
  for (let page = 1; page <= 100; page++) {
    const d = await getJson(`https://www.capgemini.com/wp-json/macs/v1/jobs?country_code=in-en&page=${page}&size=50`)
    if (!d.data?.length) break
    for (const j of d.data) {
      if (j.deleted_at) continue
      jobs.push({
        id: `capgemini-${j.id}`,
        company: "Capgemini",
        companyDomain: "capgemini.com",
        title: j.title,
        department: mapDepartment(`${j.title} ${j.professional_communities ?? ""}`),
        team: j.professional_communities || null,
        location: j.location || "India",
        workMode: null,
        jobType: /intern/i.test(j.title) ? "INTERNSHIP" : "FULL_TIME",
        experienceLevel: j.experience_level || null,
        postedAt: j.updated_at || null,
        applyUrl: j.apply_job_url,
        source: "capgemini.com",
      })
    }
    if (jobs.length >= d.total) break
    await sleep(250)
  }
  return jobs
}

async function fetchGreenhouse({ company, domain, board }) {
  const d = await getJson(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs`)
  return d.jobs
    .filter((j) => /india|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|hyderabad|pune|chennai|noida|remote/i.test(j.location?.name ?? ""))
    .map((j) => ({
      id: `${domain}-${j.id}`,
      company, companyDomain: domain, title: j.title,
      department: mapDepartment(j.title), team: null,
      location: j.location?.name ?? "India",
      workMode: /remote/i.test(j.location?.name ?? "") ? "REMOTE" : null,
      jobType: /intern/i.test(j.title) ? "INTERNSHIP" : "FULL_TIME",
      postedAt: j.updated_at ?? null,
      applyUrl: j.absolute_url, source: "greenhouse",
    }))
}

async function fetchLever({ company, domain, board }) {
  const d = await getJson(`https://api.lever.co/v0/postings/${board}?mode=json`)
  return d
    .filter((j) => /india|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|hyderabad|pune|chennai|noida|remote/i.test(j.categories?.location ?? ""))
    .map((j) => ({
      id: `${domain}-${j.id}`,
      company, companyDomain: domain, title: j.text,
      department: mapDepartment(`${j.text} ${j.categories?.team ?? ""}`), team: j.categories?.team ?? null,
      location: j.categories?.location ?? "India",
      workMode: j.workplaceType ? (WORK_MODE[j.workplaceType.toLowerCase()] ?? null) : null,
      jobType: /intern/i.test(j.text) || /intern/i.test(j.categories?.commitment ?? "") ? "INTERNSHIP" : "FULL_TIME",
      postedAt: j.createdAt ? new Date(j.createdAt).toISOString() : null,
      applyUrl: j.hostedUrl, source: "lever",
    }))
}

// Reads a company's public job sitemap and the schema.org JobPosting JSON-LD on
// each job page (published for search engines). Samples evenly across the
// sitemap up to `cap` pages, with a delay between requests.
async function fetchSitemapJobPostings({ company, domain, sitemapUrl, cap = 400, delayMs = 800, urlFilter }) {
  const xml = await (await fetch(sitemapUrl, { headers: UA })).text()
  let urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, "&"))
  if (urlFilter) urls = urls.filter(urlFilter)
  const total = urls.length
  if (urls.length > cap) {
    const step = urls.length / cap
    urls = Array.from({ length: cap }, (_, i) => urls[Math.floor(i * step)])
  }
  const jobs = []
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: UA })
      if (!res.ok) continue
      const html = await res.text()
      for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        let d
        try { d = JSON.parse(m[1]) } catch { continue }
        if (d["@type"] !== "JobPosting") continue
        if (d.validThrough && new Date(d.validThrough) < new Date()) continue
        const loc = (Array.isArray(d.jobLocation) ? d.jobLocation : [d.jobLocation]).filter(Boolean)
          .map((l) => l.address?.addressLocality).filter((x) => x && x !== "unavailable")
        const skills = [].concat(d.skills ?? [])
        jobs.push({
          id: `${domain}-${new URL(url).searchParams.get("id") ?? url}`,
          company, companyDomain: domain, title: d.title,
          department: mapDepartment(`${d.title} ${skills.join(" ")}`),
          team: skills[0] ?? null,
          location: [...new Set(loc)].join("; ") || "India",
          workMode: null,
          jobType: /intern/i.test(d.title) ? "INTERNSHIP" : /part/i.test(d.employmentType ?? "") ? "PART_TIME" : /contract|temp/i.test(d.employmentType ?? "") ? "CONTRACT" : "FULL_TIME",
          postedAt: d.datePosted ? new Date(d.datePosted).toISOString() : null,
          applyUrl: url,
          source: new URL(sitemapUrl).host,
        })
        break
      }
    } catch { /* skip page */ }
    await sleep(delayMs)
  }
  console.log(`  ${company}: sampled ${urls.length} of ${total} sitemap pages`)
  return jobs
}

// Workday public career boards (the same JSON the board pages load). Keeps
// only postings whose location mentions India or a major Indian city.
const INDIA_RE = /india|bengaluru|bangalore|mumbai|delhi|gurgaon|gurugram|hyderabad|pune|chennai|noida|kolkata|ahmedabad|kochi|coimbatore/i
async function fetchWorkday({ company, domain, host, tenant, site }) {
  const jobs = []
  for (let offset = 0; offset < 1000; offset += 20) {
    const res = await fetch(`https://${host}/wday/cxs/${tenant}/${site}/jobs`, {
      method: "POST",
      headers: { ...UA, "Content-Type": "application/json" },
      body: JSON.stringify({ appliedFacets: {}, limit: 20, offset, searchText: "India" }),
    })
    if (res.status === 429) { await sleep(5000); offset -= 20; continue }
    if (!res.ok) throw new Error(`${res.status} ${host}`)
    const d = await res.json()
    if (!d.jobPostings?.length) break
    for (const p of d.jobPostings) {
      if (!INDIA_RE.test(p.locationsText ?? "")) continue
      const ago = /(\d+)\+? Days? Ago/i.exec(p.postedOn ?? "")
      const postedAt = /today/i.test(p.postedOn ?? "") ? new Date() : /yesterday/i.test(p.postedOn ?? "") ? new Date(Date.now() - 864e5) : ago ? new Date(Date.now() - Number(ago[1]) * 864e5) : null
      jobs.push({
        id: `${domain}-${(p.bulletFields?.[0] ?? p.externalPath).replace(/\W+/g, "-")}`,
        company, companyDomain: domain, title: p.title,
        department: mapDepartment(p.title), team: null,
        location: p.locationsText, workMode: null,
        jobType: /intern/i.test(p.title) ? "INTERNSHIP" : "FULL_TIME",
        postedAt: postedAt ? postedAt.toISOString() : null,
        applyUrl: `https://${host}/${site}${p.externalPath}`,
        source: "workday",
      })
    }
    if (offset + 20 >= d.total) break
    await sleep(600)
  }
  return jobs
}

const SOURCES = [
  ["Microsoft", () => fetchEightfold({ company: "Microsoft", domain: "microsoft.com", host: "apply.careers.microsoft.com", baseUrl: "https://apply.careers.microsoft.com" })],
  ["Qualcomm", () => fetchEightfold({ company: "Qualcomm", domain: "qualcomm.com", host: "careers.qualcomm.com", baseUrl: "https://careers.qualcomm.com" })],
  ["Capgemini", fetchCapgemini],
  ["Groww", () => fetchGreenhouse({ company: "Groww", domain: "groww.in", board: "groww" })],
  ["Cred", () => fetchLever({ company: "Cred", domain: "cred.club", board: "cred" })],
  ["Meesho", () => fetchLever({ company: "Meesho", domain: "meesho.com", board: "meesho" })],
  ["Paytm", () => fetchLever({ company: "Paytm", domain: "paytm.com", board: "paytm" })],
  ["Accenture", () => fetchSitemapJobPostings({ company: "Accenture", domain: "accenture.com", sitemapUrl: "https://www.accenture.com/in-en/jobpostings-sitemap.xml" })],
  ["NVIDIA", () => fetchWorkday({ company: "NVIDIA", domain: "nvidia.com", host: "nvidia.wd5.myworkdayjobs.com", tenant: "nvidia", site: "NVIDIAExternalCareerSite" })],
  ["Salesforce", () => fetchWorkday({ company: "Salesforce", domain: "salesforce.com", host: "salesforce.wd12.myworkdayjobs.com", tenant: "salesforce", site: "External_Career_Site" })],
  ["Adobe", () => fetchWorkday({ company: "Adobe", domain: "adobe.com", host: "adobe.wd5.myworkdayjobs.com", tenant: "adobe", site: "external_experienced" })],
  ["Intel", () => fetchWorkday({ company: "Intel", domain: "intel.com", host: "intel.wd1.myworkdayjobs.com", tenant: "intel", site: "External" })],
  ["HP", () => fetchWorkday({ company: "HP", domain: "hp.com", host: "hp.wd5.myworkdayjobs.com", tenant: "hp", site: "ExternalCareerSite" })],
  ["Mastercard", () => fetchWorkday({ company: "Mastercard", domain: "mastercard.com", host: "mastercard.wd1.myworkdayjobs.com", tenant: "mastercard", site: "CorporateCareers" })],
  ["GE Vernova", () => fetchWorkday({ company: "GE Vernova", domain: "ge.com", host: "gevernova.wd5.myworkdayjobs.com", tenant: "gevernova", site: "Vernova_ExternalSite" })],
  ["Cisco", () => fetchWorkday({ company: "Cisco", domain: "cisco.com", host: "cisco.wd5.myworkdayjobs.com", tenant: "cisco", site: "Cisco_Careers" })],
  ["Procter & Gamble", () => fetchWorkday({ company: "Procter & Gamble", domain: "pg.com", host: "pg.wd5.myworkdayjobs.com", tenant: "pg", site: "1000" })],
  ["PayPal", () => fetchEightfold({ company: "PayPal", domain: "paypal.com", host: "paypal.eightfold.ai", baseUrl: "https://paypal.eightfold.ai" })],
]

// ONLY=Accenture,Foo re-fetches just those sources and merges into the existing file.
const only = process.env.ONLY?.split(",").map((x) => x.trim())

const prev = only && existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null
const all = prev ? prev.jobs.filter((j) => !only.includes(j.company)) : []
const summary = prev ? { ...prev.summary } : {}
for (const [name, run] of SOURCES) {
  if (only && !only.includes(name)) continue
  try {
    const jobs = await run()
    summary[name] = jobs.length
    all.push(...jobs)
    console.log(`${name}: ${jobs.length}`)
  } catch (err) {
    summary[name] = `failed: ${err.message}`
    console.error(`${name} FAILED:`, err.message)
  }
}

writeFileSync(OUT, JSON.stringify({ fetchedAt: new Date().toISOString(), summary, jobs: all }, null, 1))
console.log(`\nWrote ${all.length} openings to data/job-openings.json`)
