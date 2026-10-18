/**
 * Upserts brand "Corporate / Employee Purchase Program" deals.
 * Idempotent: keyed on externalId (epp-<brand>). source=MANUAL so the hourly
 * affiliate sync (which only deactivates source=API) never touches them.
 *
 * Discount values are only set where the brand's own page publishes a figure;
 * otherwise discount=0, which the UI renders as "SPECIAL OFFER".
 * URLs validated 2026-10-18.
 *
 * Run: node --env-file=.env.local scripts/seed-corporate-epp-deals.mjs
 */

import { createClient } from "@libsql/client"
import { randomBytes } from "crypto"

const url   = process.env.TURSO_DATABASE_URL
const token = process.env.TURSO_AUTH_TOKEN
if (!url || !token) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN")
  process.exit(1)
}
const db = createClient({ url, authToken: token })

// Clearbit logos were shut down; Google favicon service returns a 128px PNG per domain
const logoFor = (domain) => `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`
const cuid = () => "c" + randomBytes(11).toString("hex")
const now = new Date()
const validUntil = new Date(now.getTime() + 365 * 86400_000).toISOString()

const STEPS = (portal) =>
  `1. Open the ${portal} link.\n2. Register / sign in with your official company email address.\n3. Once your company is verified, browse the employee-only prices and checkout.`
const TERMS = "Eligibility is decided by the brand and is limited to employees of enrolled companies. Discounts and offers are set by the brand and may change without notice. Korpo is not the seller."

const DEALS = [
  {
    brand: "samsung", merchantName: "Samsung India", category: "ELECTRONICS", discount: 10,
    title: "Samsung Corporate+ — up to 10% off for employees",
    description: "Samsung Corporate+ (formerly EPP) gives employees of enrolled companies discounts of up to 10% on smartphones, laptops, TVs, home appliances and more.",
    link: "https://www.samsung.com/in/multistore/in_corporate/prelogin/", logo: logoFor("samsung.com"), badge: "EXCLUSIVE", featured: 1, trending: 1,
  },
  {
    brand: "lenovo", merchantName: "Lenovo India", category: "ELECTRONICS", discount: 10,
    title: "Lenovo Corporate Store — up to 10% off sitewide",
    description: "Exclusive Lenovo India corporate employee offers: up to 10% off sitewide, extra coupons on select laptops and rewards on purchases.",
    link: "https://www.lenovo.com/in/en/corporateemployee/", logo: logoFor("lenovo.com"), badge: "EXCLUSIVE", featured: 1, trending: 0,
  },
  {
    brand: "asus", merchantName: "ASUS India", category: "ELECTRONICS", discount: 10,
    title: "ASUS Employee Purchase Program — up to 10% additional discount",
    description: "Employees get corporate-special pricing on ASUS laptops, desktops and monitors, with up to 10% additional discount through NCEMI plus card cashback offers.",
    link: "https://www.asus.com/in/content/corporate-employee-purchase-program/", logo: logoFor("asus.com"), badge: "EXCLUSIVE", featured: 0, trending: 0,
  },
  {
    brand: "hp", merchantName: "HP India", category: "ELECTRONICS", discount: 0,
    title: "HP Corporate Employee Store — employee-only pricing",
    description: "Register on the HP India Corporate Employee Store to access employee-only pricing on HP laptops, desktops, printers and accessories.",
    link: "https://www.hp.com/in-en/shop/corporate-employee-store", logo: logoFor("hp.com"), badge: "EXCLUSIVE", featured: 0, trending: 0,
  },
  {
    brand: "lg", merchantName: "LG India", category: "ELECTRONICS", discount: 55,
    title: "LG Corporate Employee Store — up to 55% off + cashback",
    description: "LG's Special Members Store for corporate employees lists up to 55% off on TVs, monitors, ACs, air purifiers and appliances, plus cashback offers on select products.",
    link: "https://www.lg.com/in/shop/special-members-store/for-partners/", logo: logoFor("lg.com"), badge: "LIMITED_TIME", featured: 1, trending: 1,
  },
  {
    brand: "oneplus", merchantName: "OnePlus India", category: "ELECTRONICS", discount: 0,
    title: "OnePlus Corporate Employee Program",
    description: "OnePlus India's Corporate Employee Program offers special employee pricing on OnePlus phones and accessories for verified employees of enrolled companies.",
    link: "https://www.oneplus.in/corporate", logo: logoFor("oneplus.in"), badge: "EXCLUSIVE", featured: 0, trending: 0,
  },
  {
    brand: "oppo", merchantName: "OPPO India", category: "ELECTRONICS", discount: 0,
    title: "OPPO Corporate Edge Program — employee offers",
    description: "OPPO's Corporate Employee Program gives verified employees of enrolled companies special pricing on OPPO smartphones and accessories.",
    link: "https://www.oppo.com/in/store/events/employee", logo: logoFor("oppo.com"), badge: "EXCLUSIVE", featured: 0, trending: 0,
  },
  {
    brand: "apple", merchantName: "Apple India", category: "ELECTRONICS", discount: 0,
    title: "Apple Corporate Employee Purchase Program",
    description: "Apple's Corporate EPP gives employees special pricing on Mac, iPad, iPhone and accessories. Each company has its own private store link — ask your HR / IT team for yours.",
    link: "https://www.apple.com/in/", logo: logoFor("apple.com"), badge: "EXCLUSIVE", featured: 0, trending: 0,
    steps: "1. Ask your HR / IT team whether your company is enrolled in Apple's Employee Purchase Program.\n2. Get your company's private store link from them.\n3. Sign in with your work credentials and shop at employee pricing.",
  },
  {
    brand: "maruti", merchantName: "Maruti Suzuki", category: "AUTOMOTIVE", discount: 0,
    title: "Maruti Suzuki Corporate Employee Offers",
    description: "Maruti Suzuki's Institutional Sales team offers special benefits to corporate employees (including Ace / Royal / Coral club tiers). Contact them or visit a dealership with your employee ID.",
    link: "https://www.marutisuzuki.com/corporate/more-from-us/institutional-customers", logo: logoFor("marutisuzuki.com"), badge: "EXCLUSIVE", featured: 0, trending: 0,
    steps: "1. Open the Maruti Suzuki Institutional Customers page.\n2. Check the Corporate Employees section and submit your enquiry, or visit a dealership with your employee ID.\n3. The dealer confirms the benefits available for your company.",
  },
]

for (const d of DEALS) {
  const externalId = `epp-${d.brand}`
  const row = {
    title: d.title, description: d.description, discount: d.discount, category: d.category,
    merchantName: d.merchantName, merchantUrl: d.link, website: d.link, companyLogo: d.logo,
    terms: TERMS, redemptionSteps: d.steps ?? STEPS(d.merchantName),
    featured: d.featured, trending: d.trending, badge: d.badge,
    validUntil, source: "MANUAL", isActive: 1, lastUpdated: now.toISOString(),
  }
  const existing = await db.execute({ sql: "SELECT id FROM Deal WHERE externalId = ?", args: [externalId] })
  if (existing.rows.length) {
    const cols = Object.keys(row)
    await db.execute({
      sql: `UPDATE Deal SET ${cols.map((c) => `${c} = ?`).join(", ")}, updatedAt = ? WHERE id = ?`,
      args: [...cols.map((c) => row[c]), now.toISOString(), existing.rows[0].id],
    })
    console.log(`updated  ${externalId}`)
  } else {
    const all = { id: cuid(), externalId, merchantId: "admin", images: "[]", createdAt: now.toISOString(), updatedAt: now.toISOString(), ...row }
    const cols = Object.keys(all)
    await db.execute({
      sql: `INSERT INTO Deal (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
      args: cols.map((c) => all[c]),
    })
    console.log(`inserted ${externalId}`)
  }
}
console.log("Done")
