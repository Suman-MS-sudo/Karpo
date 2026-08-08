/**
 * Seeds dummy marketplace listings across all categories.
 * Run: & "C:\Program Files\nodejs\node.exe" --env-file=.env.local scripts/seed-marketplace.mjs
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
const CITIES = ["Bengaluru", "Chennai", "Mumbai", "Pune", "Hyderabad", "Delhi"]

function id()      { return "lst_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function j(v)      { return JSON.stringify(v) }

const LISTINGS = [
  { title: "MacBook Pro 14\" M3 Pro — Space Black", description: "Barely used, 8 months old. 18GB RAM, 512GB SSD. AppleCare+ till 2026. Original box, charger, and invoice included.", price: 168000, category: "ELECTRONICS", brand: "Apple", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80"]) },
  { title: "iPhone 15 Pro Max 256GB — Natural Titanium", description: "6 months old, screen protector on since day 1. No dents or scratches. Battery health 98%.", price: 112000, category: "ELECTRONICS", brand: "Apple", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1592286927505-1def25115481?w=800&q=80"]) },
  { title: "Sony WH-1000XM5 Noise Cancelling Headphones", description: "Excellent condition, comes with case and cable. Best-in-class ANC, still under warranty.", price: 21000, category: "ELECTRONICS", brand: "Sony", condition: "USED", images: j(["https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80"]) },
  { title: "Dell UltraSharp 27\" 4K Monitor U2723QE", description: "USB-C hub built in, factory calibrated for color-accurate work. Minor stand wobble, screen is perfect.", price: 34000, category: "ELECTRONICS", brand: "Dell", condition: "USED", images: j(["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80"]) },
  { title: "Honda City ZX 2021 — Petrol, Automatic", description: "34,000 km driven, single owner, all service records with Honda dealership. New tyres fitted last month.", price: 985000, category: "VEHICLE", brand: "Honda", condition: "USED", images: j(["https://images.unsplash.com/photo-1502877338535-766e1452684a?w=800&q=80"]) },
  { title: "Royal Enfield Classic 350 — 2022", description: "12,000 km, garage kept, no accidents. Comes with saddle bags and crash guard.", price: 152000, category: "VEHICLE", brand: "Royal Enfield", condition: "USED", images: j(["https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&q=80"]) },
  { title: "Trek Marlin 7 Mountain Bike — Size L", description: "Hydraulic disc brakes, 1x12 drivetrain. Ridden maybe 15 times, kept indoors.", price: 42000, category: "VEHICLE", brand: "Trek", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=80"]) },
  { title: "L-Shaped Sofa Set — 6 Seater, Grey Fabric", description: "Moving out sale — bought 1.5 years ago, no stains or tears. Genuinely comfortable, will miss it.", price: 32000, category: "FURNITURE", condition: "USED", images: j(["https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80"]) },
  { title: "Study Table + Ergonomic Chair Combo", description: "Height-adjustable desk with cable management, mesh-back ergonomic chair. WFH setup, barely used.", price: 9500, category: "FURNITURE", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800&q=80"]) },
  { title: "Queen Size Bed with Storage — Sheesham Wood", description: "Solid wood, hydraulic storage underneath. Mattress not included. Minor scratches on one leg.", price: 18500, category: "FURNITURE", condition: "USED", images: j(["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80"]) },
  { title: "LG 1.5 Ton 5-Star Split AC — 2023 Model", description: "Under warranty till 2026, serviced every 6 months. Selling due to relocation.", price: 26000, category: "APPLIANCE", brand: "LG", condition: "USED", images: j(["https://images.unsplash.com/photo-1631545806609-cd2a3d0dfdc2?w=800&q=80"]) },
  { title: "Samsung 253L Double Door Fridge", description: "Frost-free, inverter compressor, 10 yr warranty on compressor. Works perfectly, upgrading to a bigger one.", price: 15500, category: "APPLIANCE", brand: "Samsung", condition: "USED", images: j(["https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&q=80"]) },
  { title: "Whirlpool Front-Load Washing Machine 7kg", description: "Whirlpool 7kg front load, energy efficient. All manuals included, minor cosmetic wear.", price: 12500, category: "APPLIANCE", condition: "USED", images: j(["https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&q=80"]) },
  { title: "Atomic Habits + The Psychology of Money — Combo", description: "Both books in great condition, no highlighting or torn pages. Bestsellers bundle.", price: 450, category: "BOOKS", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80"]) },
  { title: "GRE Prep Book Set — Manhattan + Official Guide", description: "Complete set used for my own GRE prep (scored 325). Barely any markings.", price: 1200, category: "BOOKS", condition: "USED", images: j(["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&q=80"]) },
  { title: "Decathlon Treadmill Domyos T500B", description: "Foldable, max speed 14km/h, incline feature. 2 years old, works great, minor belt wear.", price: 18000, category: "SPORTS", brand: "Decathlon", condition: "USED", images: j(["https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&q=80"]) },
  { title: "Yonex Badminton Racket — Astrox 88D Pro", description: "Professional grade, restrung once. Comes with full cover. Selling as I switched to a lighter racket.", price: 7500, category: "SPORTS", brand: "Yonex", condition: "USED", images: j(["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&q=80"]) },
  { title: "North Face Winter Jacket — Men's L", description: "Bought for a Ladakh trip, used twice. Genuine, purchased from North Face store Delhi.", price: 6500, category: "CLOTHING", brand: "The North Face", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1544923246-77307dd654cb?w=800&q=80"]) },
  { title: "Formal Shirts Bundle — 6 pcs, Size 40", description: "Brand new with tags, ordered wrong size online. Van Heusen & Allen Solly mix.", price: 3200, category: "CLOTHING", condition: "NEW", images: j(["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80"]) },
  { title: "KitchenAid Stand Mixer — Artisan 5qt", description: "Barely used, all attachments included. Selling because I'm moving to a smaller kitchen.", price: 24000, category: "KITCHEN", brand: "KitchenAid", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=800&q=80"]) },
  { title: "Prestige Induction Cooktop + Cookware Set", description: "Complete kitchen starter kit — induction, 3 pots, 2 pans. Great for a new apartment.", price: 4500, category: "KITCHEN", condition: "USED", images: j(["https://images.unsplash.com/photo-1556909114-44e3e70034e2?w=800&q=80"]) },
  { title: "Herman Miller Aeron Chair — Size B", description: "Genuine Aeron, fully adjustable, PostureFit SL. A few years old but built to last decades.", price: 45000, category: "OFFICE", brand: "Herman Miller", condition: "USED", images: j(["https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&q=80"]) },
  { title: "Standing Desk Converter — Dual Monitor", description: "Electric height adjustment, holds 2 monitors + laptop. Great for WFH ergonomics.", price: 8900, category: "OFFICE", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?w=800&q=80"]) },
  { title: "Fitbit Charge 6 — Barely Used", description: "Bought as a gift, already have one. Sealed accessories, watch used for a week only.", price: 8500, category: "HEALTH", brand: "Fitbit", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1575311373937-c8c04a4bc4d0?w=800&q=80"]) },
  { title: "Digital Blood Pressure Monitor — Omron", description: "Used for a few months, works accurately, verified against clinic readings.", price: 1500, category: "HEALTH", brand: "Omron", condition: "USED", images: j(["https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=800&q=80"]) },
  { title: "Boho Wall Art Set — 5 Framed Prints", description: "Neutral tones, fits living room or bedroom. Selling as part of home redecoration.", price: 2800, category: "HOME_DECOR", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&q=80"]) },
  { title: "Scented Candle Gift Set — Unused", description: "Received as a gift, never opened. Premium soy wax candles, 4 fragrances.", price: 1100, category: "HOME_DECOR", condition: "NEW", images: j(["https://images.unsplash.com/photo-1602607213546-c72e4b2eed7e?w=800&q=80"]) },
  { title: "2x Coldplay Concert Tickets — Mumbai, Jan 2026", description: "Can't make it anymore, selling at face value. General standing, both together.", price: 15000, category: "TICKETS", condition: "NEW", images: j(["https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80"]) },
  { title: "Amazon Prime Membership — 6 Months Left", description: "Sharing/transferring remaining Prime membership at a discount. Genuine account transfer.", price: 500, category: "TICKETS", condition: "USED", images: j(["https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&q=80"]) },
  { title: "Yamaha Acoustic Guitar F310", description: "Great beginner guitar, includes bag and extra strings. Minor scratch on the back.", price: 6500, category: "MUSIC", brand: "Yamaha", condition: "USED", images: j(["https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&q=80"]) },
  { title: "Boya Lavalier Mic + Zoom H1n Recorder", description: "Content creator kit, used for a couple of podcast episodes. Works flawlessly.", price: 5200, category: "MUSIC", condition: "LIKE_NEW", images: j(["https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80"]) },
  { title: "Miscellaneous Office Supplies Bundle", description: "Notebooks, pens, sticky notes, a small whiteboard — clearing out my old desk.", price: 800, category: "OTHER", condition: "USED", images: j(["https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?w=800&q=80"]) },
]

console.log(`Seeding ${LISTINGS.length} marketplace listings…\n`)
let inserted = 0

for (const l of LISTINGS) {
  const lid = id()
  const now = new Date().toISOString()
  const userId = pick(USERS)
  const city   = pick(CITIES)
  try {
    await db.execute({
      sql: `INSERT INTO Listing (
        id, userId, title, description, price, category, condition,
        isNegotiable, images, status, city, isBoosted, boostLevel,
        viewCount, brand, meetingPref, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, 'BOTH', ?, ?)`,
      args: [
        lid, userId, l.title, l.description, l.price, l.category, l.condition ?? "USED",
        1, l.images, city, Math.random() < 0.15 ? 1 : 0, Math.random() < 0.15 ? "FEATURED" : "NONE",
        Math.floor(Math.random() * 200), l.brand ?? null,
        now, now,
      ],
    })
    console.log(`  ✓ [${l.category.padEnd(11)}] ${l.title.slice(0, 55)}`)
    inserted++
  } catch (err) {
    console.error(`  ✗ ${l.title.slice(0, 40)}: ${err.message}`)
  }
}

console.log(`\n✓ Done — ${inserted}/${LISTINGS.length} listings seeded.\n`)
process.exit(0)
