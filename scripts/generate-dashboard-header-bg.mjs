// Generates public/dashboard-header-bg.svg — a subtle city-skyline + location-pin
// motif in the app's indigo brand gradient, for the mobile dashboard header.
import { writeFileSync } from "fs"
import { resolve } from "path"

const W = 1200, H = 420

function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}
const rand = seeded(7)

// Skyline silhouette — a row of building rectangles of varying width/height,
// sitting along the bottom edge.
let x = -20
let buildings = ""
while (x < W + 20) {
  const w = 40 + rand() * 90
  const h = 60 + rand() * 200
  buildings += `<rect x="${x.toFixed(1)}" y="${(H - h).toFixed(1)}" width="${w.toFixed(1)}" height="${(h + 20).toFixed(1)}" fill="#ffffff" opacity="0.05" />\n`
  // A few lit windows per building
  const cols = Math.max(1, Math.floor(w / 18))
  const rows = Math.max(1, Math.floor(h / 22))
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      if (rand() > 0.6) continue
      const wx = x + 8 + c * 18
      const wy = H - h + 10 + r * 22
      buildings += `<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="7" height="9" fill="#fde68a" opacity="${(0.15 + rand() * 0.25).toFixed(2)}" />\n`
    }
  }
  x += w - 6
}

// Location pins scattered in the sky, connected faintly like a map.
const N_PINS = 9
const pins = Array.from({ length: N_PINS }, () => ({
  x: 40 + rand() * (W - 80),
  y: 30 + rand() * (H * 0.5),
}))
let pinLines = ""
for (let i = 0; i < pins.length; i++) {
  for (let j = i + 1; j < pins.length; j++) {
    const a = pins[i], b = pins[j]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    if (d < 260) {
      pinLines += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="#c7d2fe" stroke-width="1" opacity="${(0.12 * (1 - d / 260)).toFixed(2)}" />\n`
    }
  }
}
const pinMarks = pins.map((p) => {
  const s = 7 + rand() * 5
  return `<g transform="translate(${p.x.toFixed(1)},${p.y.toFixed(1)})" opacity="${(0.25 + rand() * 0.35).toFixed(2)}">
    <path d="M0 0C-${s} -${s} -${s} -${s * 2.1} 0 -${s * 2.6}C${s} -${s * 2.1} ${s} -${s} 0 0Z" fill="#ffffff" />
    <circle cx="0" cy="-${(s * 1.6).toFixed(1)}" r="${(s * 0.4).toFixed(1)}" fill="#4338ca" />
  </g>`
}).join("\n")

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4338ca" />
      <stop offset="55%" stop-color="#4f46e5" />
      <stop offset="100%" stop-color="#6366f1" />
    </linearGradient>
    <radialGradient id="glow" cx="15%" cy="0%" r="65%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.16" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />
  ${pinLines}
  ${pinMarks}
  ${buildings}
</svg>`

writeFileSync(resolve(process.cwd(), "public/dashboard-header-bg.svg"), svg)
console.log("Wrote public/dashboard-header-bg.svg")
