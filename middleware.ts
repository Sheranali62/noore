import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-Frame-Options", "SAMEORIGIN")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  if (process.env.NODE_ENV === "production") response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  return response
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
