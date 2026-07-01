import { createClient } from "@libsql/client"

const db = createClient({
  url:       "libsql://korpo-csinsights96-glitch.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODI1NTkzMDYsImlkIjoiMDE5ZjA4ZDAtNTIwMS03NDllLThlOTEtMzVkZmVmZTE4YzY3IiwicmlkIjoiYTU5MmFiZWUtNWE3Yy00YzFmLWFhZDEtMjFjYTdiMGNiYTVmIn0._lD-rmn9Eeg5yhJgIdo0Z0iuTu4AKpZWro9Cfptb2-pyZv4saKfev4omw_JSJnNKifX7IMStL65P_xhwDobDBA",
})

// Use clearbit logo API — whitelisted in next.config.mjs, reliable, no hotlink issues
const LOGOS = {
  "Swiggy":            "https://logo.clearbit.com/swiggy.com",
  "Zomato":            "https://logo.clearbit.com/zomato.com",
  "MakeMyTrip":        "https://logo.clearbit.com/makemytrip.com",
  "Amazon India":      "https://logo.clearbit.com/amazon.in",
  "Apple India":       "https://logo.clearbit.com/apple.com",
  "Netflix":           "https://logo.clearbit.com/netflix.com",
  "Coursera":          "https://logo.clearbit.com/coursera.org",
  "LinkedIn Learning": "https://logo.clearbit.com/linkedin.com",
  "HDFC Bank":         "https://logo.clearbit.com/hdfcbank.com",
  "ICICI Bank":        "https://logo.clearbit.com/icicibank.com",
  "Microsoft":         "https://logo.clearbit.com/microsoft.com",
  "Notion":            "https://logo.clearbit.com/notion.so",
  "Cult.fit":          "https://logo.clearbit.com/cult.fit",
  "Myntra":            "https://logo.clearbit.com/myntra.com",
}

let updated = 0
for (const [merchant, logo] of Object.entries(LOGOS)) {
  const res = await db.execute({
    sql:  "UPDATE Deal SET companyLogo = ? WHERE merchantName = ?",
    args: [logo, merchant],
  })
  if (res.rowsAffected > 0) {
    console.log(`✓ ${merchant}`)
    updated++
  }
}

db.close()
console.log(`\nUpdated logos for ${updated} merchants.`)
