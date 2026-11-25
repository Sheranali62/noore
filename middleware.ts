import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("Content-Security-Policy", "frame-ancestors 'self'; object-src 'none'; base-uri 'self'")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  const pathname = request.nextUrl.pathname
  if (
    pathname.startsWith("/api/admin/") ||
    pathname.startsWith("/app/api/admin/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/app/api/auth/") ||
    pathname === "/api/register" ||
    pathname === "/app/api/register"
  ) {
    response.headers.set("Cache-Control", "private, no-store, max-age=0")
    response.headers.set("Pragma", "no-cache")
  }
  if (process.env.NODE_ENV === "production") response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  return response
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
