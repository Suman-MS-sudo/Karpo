import { createClient } from "@libsql/client"
import { randomBytes } from "crypto"

const db = createClient({
  url:       "libsql://korpo-csinsights96-glitch.aws-ap-south-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJpYXQiOjE3ODI1NTkzMDYsImlkIjoiMDE5ZjA4ZDAtNTIwMS03NDllLThlOTEtMzVkZmVmZTE4YzY3IiwicmlkIjoiYTU5MmFiZWUtNWE3Yy00YzFmLWFhZDEtMjFjYTdiMGNiYTVmIn0._lD-rmn9Eeg5yhJgIdo0Z0iuTu4AKpZWro9Cfptb2-pyZv4saKfev4omw_JSJnNKifX7IMStL65P_xhwDobDBA",
})

function cuid() {
  return "c" + randomBytes(11).toString("hex")
}

const now = new Date()
const future = (days) => new Date(now.getTime() + days * 86400000).toISOString()

const deals = [
  // FOOD & DINING
  {
    title: "30% off on all orders above ₹299",
    description: "Exclusive corporate discount on Swiggy for all verified employees. Valid on restaurant orders, Instamart, and Genie deliveries.",
    discount: 30, code: "KORPO30", category: "FOOD_DINING",
    merchantName: "Swiggy", merchantUrl: "https://swiggy.com",
    companyLogo: "https://logos-world.net/wp-content/uploads/2020/11/Swiggy-Logo.png",
    validUntil: future(90), usageLimit: 500, featured: 1, trending: 1, badge: "TRENDING",
    source: "MANUAL",
  },
  {
    title: "Flat ₹120 off on Zomato Gold orders",
    description: "Get ₹120 instant discount on your Zomato orders. Use this exclusive corporate code at checkout. Min order ₹399.",
    discount: 20, code: "ZOMKORPO", category: "FOOD_DINING",
    merchantName: "Zomato", merchantUrl: "https://zomato.com",
    companyLogo: "https://b.zmtcdn.com/web_assets/b40b97e677bc7b2ca77c58c61db266fe1603954218.png",
    validUntil: future(60), usageLimit: 300, featured: 0, trending: 1, badge: "NEW",
    source: "MANUAL",
  },
  {
    title: "Buy 1 Get 1 Free at Cafe Coffee Day",
    description: "Show your corporate ID at any CCD outlet and get a complimentary beverage on your second visit. Valid on all beverages.",
    discount: 50, code: null, category: "FOOD_DINING",
    merchantName: "Cafe Coffee Day", merchantUrl: "https://cafecoffeeday.com",
    companyLogo: null,
    validUntil: future(120), usageLimit: null, featured: 0, trending: 0, badge: "EXCLUSIVE",
    source: "MANUAL",
  },
  {
    title: "20% off on Zepto grocery orders",
    description: "Save 20% on all grocery and essentials ordered via Zepto. Minimum order ₹499. Discount auto-applied at checkout.",
    discount: 20, code: "KORP20ZPT", category: "FOOD_DINING",
    merchantName: "Zepto", merchantUrl: "https://zeptonow.com",
    companyLogo: null,
    validUntil: future(45), usageLimit: 200, featured: 0, trending: 0, badge: "NEW",
    source: "MANUAL",
  },

  // TRAVEL
  {
    title: "Up to 40% off on domestic flights",
    description: "Book domestic flights on MakeMyTrip with this exclusive corporate code and save up to 40%. Valid on all airlines, all routes.",
    discount: 40, code: "MMTKORPO", category: "TRAVEL",
    merchantName: "MakeMyTrip", merchantUrl: "https://makemytrip.com",
    companyLogo: "https://imgak.mmtcdn.com/pwa_v3/pwa_hotel_assets/header/mmtLogoWhite.png",
    validUntil: future(180), usageLimit: null, featured: 1, trending: 0, badge: "EXCLUSIVE",
    source: "MANUAL",
  },
  {
    title: "₹500 cashback on train bookings",
    description: "Book any train ticket on IRCTC through Cleartrip and get ₹500 cashback. Valid for tatkal and regular bookings.",
    discount: 15, code: "CTKORPO500", category: "TRAVEL",
    merchantName: "Cleartrip", merchantUrl: "https://cleartrip.com",
    companyLogo: null,
    validUntil: future(90), usageLimit: 150, featured: 0, trending: 0, badge: null,
    source: "MANUAL",
  },

  // SHOPPING
  {
    title: "Extra 15% off on Amazon Prime orders",
    description: "Get an additional 15% discount on all Amazon purchases. Stack with existing Prime deals for maximum savings. No minimum order.",
    discount: 15, code: "AMZNKORPO", category: "SHOPPING",
    merchantName: "Amazon India", merchantUrl: "https://amazon.in",
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png",
    validUntil: future(365), usageLimit: null, featured: 1, trending: 1, badge: "EXCLUSIVE",
    source: "MANUAL",
  },
  {
    title: "Flat 25% off sitewide on Myntra",
    description: "Shop fashion, beauty, and home décor on Myntra with 25% off on all brands. Valid on full-price items. No coupon needed.",
    discount: 25, code: "MYNKORPO25", category: "SHOPPING",
    merchantName: "Myntra", merchantUrl: "https://myntra.com",
    companyLogo: null,
    validUntil: future(60), usageLimit: 400, featured: 0, trending: 1, badge: "TRENDING",
    source: "MANUAL",
  },

  // ELECTRONICS
  {
    title: "₹3000 off on laptops & desktops",
    description: "Flat ₹3000 discount on all laptops, PCs, and peripherals on Croma. Valid on purchases above ₹25,000.",
    discount: 12, code: "CROMKORPO", category: "ELECTRONICS",
    merchantName: "Croma", merchantUrl: "https://croma.com",
    companyLogo: null,
    validUntil: future(60), usageLimit: 100, featured: 0, trending: 0, badge: null,
    source: "MANUAL",
  },
  {
    title: "10% corporate discount on Apple products",
    description: "Verified corporate employees get 10% off on all Apple products including iPhone, MacBook, iPad and accessories at Apple Authorised Resellers.",
    discount: 10, code: "APPLEKORPO", category: "ELECTRONICS",
    merchantName: "Apple India", merchantUrl: "https://apple.com/in",
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    validUntil: future(365), usageLimit: null, featured: 1, trending: 0, badge: "EXCLUSIVE",
    source: "MANUAL",
  },

  // FASHION
  {
    title: "30% off on formal wear at FabIndia",
    description: "Exclusive 30% discount on formals, ethnic wear, and accessories at all FabIndia stores and online. Show corporate ID for in-store discount.",
    discount: 30, code: "FABKORPO30", category: "FASHION",
    merchantName: "FabIndia", merchantUrl: "https://fabindia.com",
    companyLogo: null,
    validUntil: future(90), usageLimit: 200, featured: 0, trending: 0, badge: null,
    source: "MANUAL",
  },
  {
    title: "Flat 40% off on Van Heusen workwear",
    description: "Premium formals for corporate professionals. 40% off on shirts, trousers, blazers and complete suit sets. Valid online only.",
    discount: 40, code: "VHKORPO40", category: "FASHION",
    merchantName: "Van Heusen", merchantUrl: "https://vanheusenindia.com",
    companyLogo: null,
    validUntil: future(45), usageLimit: 300, featured: 0, trending: 1, badge: "LIMITED_TIME",
    source: "MANUAL",
  },

  // ENTERTAINMENT
  {
    title: "3 months Netflix Standard at ₹149/month",
    description: "Corporate plan: Get Netflix Standard (2 screens, Full HD) for just ₹149 per month for the first 3 months. Cancel anytime.",
    discount: 65, code: "NFLXKORPO", category: "ENTERTAINMENT",
    merchantName: "Netflix", merchantUrl: "https://netflix.com",
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg",
    validUntil: future(30), usageLimit: 500, featured: 1, trending: 1, badge: "LIMITED_TIME",
    source: "MANUAL",
  },
  {
    title: "Sony LIV Premium — 6 months at ₹299",
    description: "Binge unlimited movies, web series, live sports, and originals on Sony LIV. Corporate pack: 6 months at just ₹299.",
    discount: 50, code: "SLIVKORPO", category: "ENTERTAINMENT",
    merchantName: "Sony LIV", merchantUrl: "https://sonyliv.com",
    companyLogo: null,
    validUntil: future(60), usageLimit: null, featured: 0, trending: 0, badge: "NEW",
    source: "MANUAL",
  },

  // HEALTH & FITNESS
  {
    title: "50% off annual Cult.fit membership",
    description: "Get unlimited gym, yoga, dance, and HIIT classes at Cult.fit centres across India. Corporate pack: 50% off on annual plans.",
    discount: 50, code: "CULTKORPO", category: "HEALTH_FITNESS",
    merchantName: "Cult.fit", merchantUrl: "https://cult.fit",
    companyLogo: null,
    validUntil: future(90), usageLimit: 200, featured: 1, trending: 1, badge: "EXCLUSIVE",
    source: "MANUAL",
  },
  {
    title: "Free first month on Healthify Me premium",
    description: "Track nutrition, get AI diet plans, and connect with certified dieticians. First month free for corporate employees.",
    discount: 100, code: "HFYKORPO1M", category: "HEALTH_FITNESS",
    merchantName: "Healthify Me", merchantUrl: "https://healthifyme.com",
    companyLogo: null,
    validUntil: future(60), usageLimit: 150, featured: 0, trending: 0, badge: "NEW",
    source: "MANUAL",
  },

  // BANKING
  {
    title: "Zero joining fee HDFC Corporate Card",
    description: "Apply for HDFC Bank Corporate Credit Card with zero joining and annual fee for verified corporate employees. 5X reward points on business spends.",
    discount: 100, code: null, category: "BANKING",
    merchantName: "HDFC Bank", merchantUrl: "https://hdfcbank.com",
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg",
    validUntil: future(365), usageLimit: null, featured: 0, trending: 0, badge: "EXCLUSIVE",
    source: "MANUAL",
  },
  {
    title: "2% cashback on all ICICI Salary Account spends",
    description: "Open an ICICI Bank Salary Account with 2% cashback on all UPI and card transactions. No minimum balance required for corporate accounts.",
    discount: 2, code: null, category: "BANKING",
    merchantName: "ICICI Bank", merchantUrl: "https://icicibank.com",
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg",
    validUntil: future(365), usageLimit: null, featured: 0, trending: 0, badge: null,
    source: "MANUAL",
  },

  // EDUCATION
  {
    title: "60% off on Coursera Plus annual plan",
    description: "Access 7,000+ courses, certificates, and professional degrees on Coursera. Corporate discount: 60% off on annual Plus subscription.",
    discount: 60, code: "COURKORPO60", category: "EDUCATION",
    merchantName: "Coursera", merchantUrl: "https://coursera.org",
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Coursera-Logo_600x600.svg/800px-Coursera-Logo_600x600.svg.png",
    validUntil: future(120), usageLimit: null, featured: 1, trending: 0, badge: "EXCLUSIVE",
    source: "MANUAL",
  },
  {
    title: "3 months free LinkedIn Learning",
    description: "Upskill with 20,000+ expert-led courses on LinkedIn Learning. Free 3-month access for all verified corporate professionals.",
    discount: 100, code: "LINKEDUKORPO", category: "EDUCATION",
    merchantName: "LinkedIn Learning", merchantUrl: "https://linkedin.com/learning",
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    validUntil: future(90), usageLimit: 500, featured: 0, trending: 1, badge: "NEW",
    source: "MANUAL",
  },

  // HOTELS
  {
    title: "20% off on OYO business stays",
    description: "Discounted corporate rates at 1 lakh+ OYO hotels and rooms across India. Book through OYO Business and save 20% on every stay.",
    discount: 20, code: "OYOKORPO20", category: "HOTELS",
    merchantName: "OYO Business", merchantUrl: "https://oyorooms.com",
    companyLogo: null,
    validUntil: future(180), usageLimit: null, featured: 0, trending: 0, badge: null,
    source: "MANUAL",
  },
  {
    title: "Flat 25% off at Marriott Bonvoy properties",
    description: "Exclusive corporate rate at all Marriott Bonvoy hotels in India. Includes complimentary breakfast and early check-in based on availability.",
    discount: 25, code: "MARKORPO", category: "HOTELS",
    merchantName: "Marriott Bonvoy", merchantUrl: "https://marriott.com",
    companyLogo: null,
    validUntil: future(365), usageLimit: null, featured: 1, trending: 0, badge: "EXCLUSIVE",
    source: "MANUAL",
  },

  // SOFTWARE
  {
    title: "40% off on Microsoft 365 Personal",
    description: "Get the full Microsoft 365 suite — Word, Excel, PowerPoint, Teams, and 1TB OneDrive. Corporate discount: 40% off on annual plan.",
    discount: 40, code: "MS365KORPO", category: "SOFTWARE",
    merchantName: "Microsoft", merchantUrl: "https://microsoft.com",
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    validUntil: future(365), usageLimit: null, featured: 1, trending: 0, badge: "EXCLUSIVE",
    source: "MANUAL",
  },
  {
    title: "Free 1-year Notion Plus plan",
    description: "Notion Plus for personal use — unlimited pages, file uploads, and version history. Completely free for verified corporate employees.",
    discount: 100, code: "NOTIONKORPO", category: "SOFTWARE",
    merchantName: "Notion", merchantUrl: "https://notion.so",
    companyLogo: "https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png",
    validUntil: future(90), usageLimit: 1000, featured: 0, trending: 1, badge: "NEW",
    source: "MANUAL",
  },

  // LIFESTYLE
  {
    title: "30% off on Nykaa beauty products",
    description: "Shop makeup, skincare, hair care, and wellness products on Nykaa with 30% off. Exclusive for corporate employees.",
    discount: 30, code: "NYKAKORPO", category: "LIFESTYLE",
    merchantName: "Nykaa", merchantUrl: "https://nykaa.com",
    companyLogo: null,
    validUntil: future(60), usageLimit: 300, featured: 0, trending: 1, badge: "TRENDING",
    source: "MANUAL",
  },

  // INSURANCE
  {
    title: "15% discount on PolicyBazaar term plans",
    description: "Get additional 15% corporate discount on term life insurance plans via PolicyBazaar. No medical test for sum insured up to ₹50 lakh.",
    discount: 15, code: null, category: "INSURANCE",
    merchantName: "PolicyBazaar", merchantUrl: "https://policybazaar.com",
    companyLogo: null,
    validUntil: future(180), usageLimit: null, featured: 0, trending: 0, badge: null,
    source: "MANUAL",
  },

  // AUTOMOTIVE
  {
    title: "Free 1-year Zoomcar subscription + 10% off",
    description: "Corporate plan: Free Zoomcar subscription (worth ₹999) plus 10% off on all self-drive car rentals. Perfect for business travel.",
    discount: 10, code: "ZOOMKORPO", category: "AUTOMOTIVE",
    merchantName: "Zoomcar", merchantUrl: "https://zoomcar.com",
    companyLogo: null,
    validUntil: future(90), usageLimit: 200, featured: 0, trending: 0, badge: "NEW",
    source: "MANUAL",
  },
]

let inserted = 0
for (const d of deals) {
  const id = cuid()
  try {
    await db.execute({
      sql: `INSERT INTO Deal (
        id, merchantId, title, description, discount, code,
        validFrom, validUntil, category, images, isActive,
        merchantName, merchantUrl, companyLogo, terms, redemptionSteps,
        website, usageLimit, usedCount, viewCount,
        featured, trending, badge, source, lastUpdated,
        createdAt, updatedAt
      ) VALUES (
        ?, 'admin', ?, ?, ?, ?,
        NULL, ?, ?, '[]', 1,
        ?, ?, ?, NULL, NULL,
        NULL, ?, 0, 0,
        ?, ?, ?, ?, CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )`,
      args: [
        id, d.title, d.description, d.discount, d.code ?? null,
        d.validUntil, d.category,
        d.merchantName, d.merchantUrl ?? null, d.companyLogo ?? null,
        d.usageLimit ?? null,
        d.featured, d.trending, d.badge ?? null, d.source,
      ],
    })
    console.log(`✓ ${d.merchantName} — ${d.title.slice(0, 50)}`)
    inserted++
  } catch (e) {
    console.error(`✗ ${d.merchantName}: ${e.message.split("\n")[0]}`)
  }
}

db.close()
console.log(`\nDone. ${inserted}/${deals.length} deals inserted.`)
