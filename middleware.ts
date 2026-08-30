import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Routes that are accessible without a session
const PUBLIC_PREFIXES = [
  "/auth/",
  "/api/auth/",
  "/api/id-verification",
  "/_next/",
  "/favicon.ico",
  "/terms",
  "/privacy",
  "/about",
  "/contact",
  "/robots.txt",
  "/sitemap.xml",
  // External callers (Meta's webhook handshake, Vercel Cron) can never
  // present a session cookie — these routes carry their own token/HMAC
  // checks instead, which must be allowed to actually run.
  "/api/whatsapp/",
  "/api/cron/",
]

// Static assets served from /public (logos, favicons, decorative images) —
// always accessible regardless of session, same as any other public site asset.
const STATIC_ASSET_RE = /\.(png|jpe?g|svg|webp|gif|ico|avif)$/i

// Landing page is public; everything else under "/" requires auth
const PUBLIC_EXACT = new Set(["/"])

// HTTP methods that mutate state — blocked for the read-only GUEST role.
// GET/HEAD/OPTIONS (browsing) always pass through.
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

export async function middleware(req: NextRequest) {
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

  // GUEST is a read-only demo role — can browse everything a normal user can,
  // but can't create/edit/delete anything (listings, referrals, messages,
  // profile, etc). Enforced here in one place rather than in every route.
  if (MUTATING_METHODS.has(req.method)) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET })
    if (token?.role === "GUEST") {
      return NextResponse.json(
        { error: "This is a guest account and can only browse — it can't create, edit, or delete anything." },
        { status: 403 }
      )
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
