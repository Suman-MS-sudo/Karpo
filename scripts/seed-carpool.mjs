/**
 * Seeds dummy carpool routes.
 * Run: & "C:\Program Files\nodejs\node.exe" --env-file=.env.local scripts/seed-carpool.mjs
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

function id()      { return "cpl_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function j(v)      { return JSON.stringify(v) }

const ROUTES = [
  { from: "Whitefield, Bengaluru", to: "Electronic City, Bengaluru", time: "08:30", freq: "WEEKDAYS", vehicle: "SEDAN", seats: 3, price: 120, ac: true },
  { from: "HSR Layout, Bengaluru", to: "Manyata Tech Park, Bengaluru", time: "09:00", freq: "WEEKDAYS", vehicle: "HATCHBACK", seats: 2, price: 90, ac: true },
  { from: "Koramangala, Bengaluru", to: "Whitefield, Bengaluru", time: "08:45", freq: "DAILY", vehicle: "SUV", seats: 4, price: 150, ac: true },
  { from: "Indiranagar, Bengaluru", to: "Bagmane Tech Park, Bengaluru", time: "09:15", freq: "WEEKDAYS", vehicle: "SEDAN", seats: 3, price: 100, ac: false },
  { from: "Marathahalli, Bengaluru", to: "Outer Ring Road, Bengaluru", time: "08:00", freq: "WEEKDAYS", vehicle: "HATCHBACK", seats: 2, price: 70, ac: true },
  { from: "OMR, Chennai", to: "Tidel Park, Chennai", time: "08:30", freq: "WEEKDAYS", vehicle: "SEDAN", seats: 3, price: 110, ac: true },
  { from: "Velachery, Chennai", to: "DLF IT Park, Chennai", time: "09:00", freq: "DAILY", vehicle: "HATCHBACK", seats: 2, price: 85, ac: false },
  { from: "Powai, Mumbai", to: "BKC, Mumbai", time: "08:15", freq: "WEEKDAYS", vehicle: "SEDAN", seats: 3, price: 130, ac: true },
  { from: "Andheri East, Mumbai", to: "Lower Parel, Mumbai", time: "08:45", freq: "WEEKDAYS", vehicle: "SUV", seats: 4, price: 160, ac: true },
  { from: "Hinjewadi, Pune", to: "Kharadi, Pune", time: "08:30", freq: "WEEKDAYS", vehicle: "SEDAN", seats: 3, price: 100, ac: true },
  { from: "Baner, Pune", to: "Magarpatta, Pune", time: "09:00", freq: "DAILY", vehicle: "HATCHBACK", seats: 2, price: 90, ac: false },
  { from: "Gachibowli, Hyderabad", to: "HITEC City, Hyderabad", time: "08:30", freq: "WEEKDAYS", vehicle: "SEDAN", seats: 3, price: 80, ac: true },
  { from: "Kondapur, Hyderabad", to: "Financial District, Hyderabad", time: "09:00", freq: "WEEKDAYS", vehicle: "HATCHBACK", seats: 2, price: 75, ac: false },
  { from: "Cyber City, Gurgaon", to: "Connaught Place, Delhi", time: "08:00", freq: "WEEKDAYS", vehicle: "SUV", seats: 4, price: 180, ac: true },
  { from: "Noida Sector 62", to: "Cyber City, Gurgaon", time: "07:45", freq: "WEEKDAYS", vehicle: "SEDAN", seats: 3, price: 200, ac: true },
  { from: "Jayanagar, Bengaluru", to: "Bellandur, Bengaluru", time: "18:30", freq: "ONCE", vehicle: "HATCHBACK", seats: 2, price: 90, ac: true },
]

console.log(`Seeding ${ROUTES.length} carpool routes…\n`)
let inserted = 0

for (const r of ROUTES) {
  const rid = id()
  const now = new Date().toISOString()
  const userId = pick(USERS)
  const departureAt = r.freq === "ONCE" ? new Date(Date.now() + (1 + Math.floor(Math.random() * 5)) * 86400_000).toISOString() : null
  try {
    await db.execute({
      sql: `INSERT INTO CarpoolRoute (
        id, userId, fromLocation, toLocation, departureTime, departureAt,
        seatsAvailable, pricePerSeat, frequency, vehicleType, acAvailable,
        pickupPoints, isActive, isBoosted, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      args: [
        rid, userId, r.from, r.to, r.time, departureAt,
        r.seats, r.price, r.freq, r.vehicle, r.ac ? 1 : 0,
        j([]), Math.random() < 0.15 ? 1 : 0,
        now, now,
      ],
    })
    console.log(`  ✓ [${r.freq.padEnd(9)}] ${r.from} → ${r.to}`)
    inserted++
  } catch (err) {
    console.error(`  ✗ ${r.from} → ${r.to}: ${err.message}`)
  }
}

console.log(`\n✓ Done — ${inserted}/${ROUTES.length} carpool routes seeded.\n`)
process.exit(0)
