/**
 * Seeds dummy rental posts across all types.
 * Run: & "C:\Program Files\nodejs\node.exe" --env-file=.env.local scripts/seed-rentals.mjs
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

function id()      { return "rnt_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function j(v)      { return JSON.stringify(v) }
function daysFromNow(n) { return new Date(Date.now() + n * 86400_000).toISOString() }

const RENTALS = [
  { title: "Spacious 2BHK near Whitefield Tech Park", type: "APARTMENT", rent: 32000, deposit: 96000, city: "Bengaluru", area: "Whitefield", bhk: "2BHK", furnished: "SEMI", amenities: j(["WiFi", "Parking", "Security", "Power Backup"]), images: j(["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80"]) },
  { title: "Premium 3BHK with Clubhouse Access — Sarjapur", type: "APARTMENT", rent: 48000, deposit: 150000, city: "Bengaluru", area: "Sarjapur Road", bhk: "3BHK", furnished: "FULLY", amenities: j(["WiFi", "Gym", "Parking", "Security"]), images: j(["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80"]) },
  { title: "Cozy 1BHK — Walk to Metro, Indiranagar", type: "APARTMENT", rent: 24000, deposit: 60000, city: "Bengaluru", area: "Indiranagar", bhk: "1BHK", furnished: "SEMI", amenities: j(["WiFi", "Parking"]), images: j(["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"]) },
  { title: "Single Room in Shared 3BHK — Powai", type: "ROOM", rent: 14000, deposit: 28000, city: "Mumbai", area: "Powai", bhk: "Room", furnished: "FULLY", amenities: j(["WiFi", "Meals"]), images: j(["https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?w=800&q=80"]) },
  { title: "AC PG for Working Professionals — Gachibowli", type: "PG", rent: 11000, deposit: 11000, city: "Hyderabad", area: "Gachibowli", occupancy: "SINGLE", furnished: "FULLY", amenities: j(["WiFi", "Meals", "Power Backup", "Security"]), images: j(["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800&q=80"]) },
  { title: "Female PG with Home-Cooked Meals — HSR Layout", type: "PG", rent: 13500, deposit: 13500, city: "Bengaluru", area: "HSR Layout", gender: "FEMALE", occupancy: "DOUBLE", furnished: "FULLY", amenities: j(["WiFi", "Meals", "Security"]), images: j(["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80"]) },
  { title: "Looking for Flatmate — 2BHK in Koramangala", type: "FLATMATE", rent: 18000, deposit: 18000, city: "Bengaluru", area: "Koramangala", furnished: "FULLY", amenities: j(["WiFi", "Parking", "Gym"]), images: j(["https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&q=80"]) },
  { title: "Flatmate Wanted — 3BHK Near Tech Park, Chennai", type: "FLATMATE", rent: 15500, deposit: 15500, city: "Chennai", area: "OMR", furnished: "SEMI", amenities: j(["WiFi", "Parking"]), images: j(["https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=800&q=80"]) },
  { title: "Studio Apartment — Fully Furnished, Hinjewadi", type: "STUDIO", rent: 19500, deposit: 39000, city: "Pune", area: "Hinjewadi", bhk: "Studio", furnished: "FULLY", amenities: j(["WiFi", "Gym", "Security"]), images: j(["https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800&q=80"]) },
  { title: "Compact Studio — Ideal for Singles, Andheri", type: "STUDIO", rent: 27000, deposit: 54000, city: "Mumbai", area: "Andheri East", bhk: "Studio", furnished: "FULLY", amenities: j(["WiFi", "Security"]), images: j(["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"]) },
  { title: "Independent Villa with Garden — Whitefield", type: "VILLA", rent: 75000, deposit: 225000, city: "Bengaluru", area: "Whitefield", bhk: "4BHK+", furnished: "SEMI", amenities: j(["WiFi", "Parking", "Security", "Power Backup"]), images: j(["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80"]) },
  { title: "4BHK Villa with Private Pool — ECR", type: "VILLA", rent: 95000, deposit: 285000, city: "Chennai", area: "ECR", bhk: "4BHK+", furnished: "FULLY", amenities: j(["WiFi", "Parking", "Gym", "Security"]), images: j(["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80"]) },
  { title: "2BHK Near IT Corridor — Gurgaon", type: "APARTMENT", rent: 38000, deposit: 114000, city: "Delhi", area: "Cyber City, Gurgaon", bhk: "2BHK", furnished: "SEMI", amenities: j(["WiFi", "Parking", "Gym", "Security"]), images: j(["https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=800&q=80"]) },
  { title: "Budget Room for Rent — Near Metro, Kondapur", type: "ROOM", rent: 9500, deposit: 19000, city: "Hyderabad", area: "Kondapur", bhk: "Room", furnished: "SEMI", amenities: j(["WiFi"]), images: j(["https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80"]) },
  { title: "Co-living PG with Coworking Space — Kharadi", type: "PG", rent: 16000, deposit: 16000, city: "Pune", area: "Kharadi", occupancy: "SINGLE", furnished: "FULLY", amenities: j(["WiFi", "Meals", "Gym", "Security"]), images: j(["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80"]) },
]

console.log(`Seeding ${RENTALS.length} rental posts…\n`)
let inserted = 0

for (const r of RENTALS) {
  const rid = id()
  const now = new Date().toISOString()
  const userId = pick(USERS)
  try {
    await db.execute({
      sql: `INSERT INTO RentalPost (
        id, userId, title, type, rent, deposit, city, area, amenities, images,
        availableFrom, status, description, bhk, furnished, gender, occupancy,
        viewCount, isBoosted, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        rid, userId, r.title, r.type, r.rent, r.deposit ?? null, r.city, r.area, r.amenities, r.images,
        daysFromNow(Math.floor(Math.random() * 14)), null, r.bhk ?? null, r.furnished ?? "UNFURNISHED",
        r.gender ?? "ANY", r.occupancy ?? "SINGLE",
        Math.floor(Math.random() * 150), Math.random() < 0.15 ? 1 : 0,
        now, now,
      ],
    })
    console.log(`  ✓ [${r.type.padEnd(9)}] ${r.title.slice(0, 55)}`)
    inserted++
  } catch (err) {
    console.error(`  ✗ ${r.title.slice(0, 40)}: ${err.message}`)
  }
}

console.log(`\n✓ Done — ${inserted}/${RENTALS.length} rentals seeded.\n`)
process.exit(0)
