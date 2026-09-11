// Generates public/profile-banner-default.svg — a plexus/network graphic
// matching the app's brand gradient, with no external assets or watermarks.
import { writeFileSync } from "fs"
import { resolve } from "path"

const W = 1600, H = 500
const N = 55

function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}
const rand = seeded(42)

const points = Array.from({ length: N }, () => ({
  x: rand() * W,
  y: rand() * H,
  r: 1.5 + rand() * 2.5,
}))

const MAX_DIST = 220
let lines = ""
for (let i = 0; i < points.length; i++) {
  for (let j = i + 1; j < points.length; j++) {
    const a = points[i], b = points[j]
    const d = Math.hypot(a.x - b.x, a.y - b.y)
    if (d < MAX_DIST) {
      const opacity = (1 - d / MAX_DIST) * 0.45
      lines += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="url(#lineGrad)" stroke-width="1" opacity="${opacity.toFixed(2)}" />\n`
    }
  }
}

const dots = points.map((p) =>
  `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${p.r.toFixed(1)}" fill="#7dd3fc" opacity="0.85" />`
).join("\n")

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="55%" stop-color="#3730a3" />
      <stop offset="100%" stop-color="#0891b2" />
    </linearGradient>
    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#93c5fd" />
      <stop offset="100%" stop-color="#67e8f9" />
    </linearGradient>
    <radialGradient id="glow" cx="80%" cy="15%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgGrad)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />
  ${lines}
  ${dots}
</svg>`

writeFileSync(resolve(process.cwd(), "public/profile-banner-default.svg"), svg)
console.log("Wrote public/profile-banner-default.svg")
