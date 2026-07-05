import { NextRequest, NextResponse } from "next/server"

// Routes that are accessible without a session
const PUBLIC_PREFIXES = [
  "/auth/",
  "/api/auth/",
  "/_next/",
  "/favicon.ico",
  "/terms",
  "/privacy",
  "/about",
  "/contact",
  "/robots.txt",
  "/sitemap.xml",
]

// Static assets served from /public (logos, favicons, decorative images) —
// always accessible regardless of session, same as any other public site asset.
const STATIC_ASSET_RE = /\.(png|jpe?g|svg|webp|gif|ico|avif)$/i

// Landing page is public; everything else under "/" requires auth
const PUBLIC_EXACT = new Set(["/"])

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_EXACT.has(pathname)) return NextResponse.next()
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next()
  if (STATIC_ASSET_RE.test(pathname)) return NextResponse.next()

  // NextAuth v5 JWT cookies — HTTP dev uses plain name, HTTPS prod uses __Secure- prefix
  const sessionToken =
    req.cookies.get("__Secure-authjs.session-token")?.value ??
    req.cookies.get("authjs.session-token")?.value

  if (!sessionToken) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = "/auth/signin"
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
