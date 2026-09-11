// Generates public/messages-banner.svg and public/notifications-banner.svg —
// compact themed background art for the Messages and Alerts page headers.
import { writeFileSync } from "fs"
import { resolve } from "path"

const W = 1400, H = 320

function seeded(seed) {
  let s = seed
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
}

function chatBubblesSvg() {
  const rand = seeded(101)
  let shapes = ""
  const N = 14
  for (let i = 0; i < N; i++) {
    const w = 60 + rand() * 140
    const h = w * (0.55 + rand() * 0.15)
    const x = rand() * (W - w)
    const y = rand() * (H - h)
    const r = 14
    const tailRight = rand() > 0.5
    const opacity = (0.05 + rand() * 0.08).toFixed(2)
    shapes += `<g opacity="${opacity}">
      <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${r}" fill="#ffffff" />
      ${tailRight
        ? `<path d="M${(x + w - 18).toFixed(1)} ${(y + h - 2).toFixed(1)} l16 14 l-4 -16 Z" fill="#ffffff" />`
        : `<path d="M${(x + 18).toFixed(1)} ${(y + h - 2).toFixed(1)} l-16 14 l4 -16 Z" fill="#ffffff" />`}
    </g>`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4338ca" />
      <stop offset="55%" stop-color="#6d28d9" />
      <stop offset="100%" stop-color="#7e22ce" />
    </linearGradient>
    <radialGradient id="glow" cx="85%" cy="0%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />
  ${shapes}
</svg>`
  writeFileSync(resolve(process.cwd(), "public/messages-banner.svg"), svg)
  console.log("Wrote public/messages-banner.svg")
}

function alertWavesSvg() {
  const rand = seeded(202)
  // Concentric "ping" rings, like a notification pulse, scattered around.
  const rings = Array.from({ length: 6 }, () => ({
    x: rand() * W,
    y: rand() * H,
    r: 30 + rand() * 70,
  }))
  let ringShapes = ""
  for (const c of rings) {
    for (let k = 0; k < 3; k++) {
      const r = c.r + k * 22
      ringShapes += `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="${(0.1 - k * 0.025).toFixed(2)}" />\n`
    }
  }
  // Small bell-dot accents
  let dots = ""
  for (let i = 0; i < 20; i++) {
    const x = rand() * W, y = rand() * H
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(1.5 + rand() * 2.5).toFixed(1)}" fill="#fde68a" opacity="${(0.2 + rand() * 0.3).toFixed(2)}" />\n`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#b45309" />
      <stop offset="55%" stop-color="#c2410c" />
      <stop offset="100%" stop-color="#9f1239" />
    </linearGradient>
    <radialGradient id="glow" cx="15%" cy="10%" r="70%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)" />
  <rect width="${W}" height="${H}" fill="url(#glow)" />
  ${ringShapes}
  ${dots}
</svg>`
  writeFileSync(resolve(process.cwd(), "public/notifications-banner.svg"), svg)
  console.log("Wrote public/notifications-banner.svg")
}

chatBubblesSvg()
alertWavesSvg()
