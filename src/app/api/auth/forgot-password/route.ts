import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIp, enforceRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const databaseLimit = await enforceRateLimit(request, "password-recovery", 5, 900000)
  if (databaseLimit) return databaseLimit
  const rate = checkRateLimit(`password-recovery:${getClientIp(request)}`, 3, 3600000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds), "Cache-Control": "no-store" } }
    )
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    console.error("Password recovery requires Supabase URL and anon key.")
    return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 })
  }

  try {
    const origin = request.headers.get("origin")
    let crossSite = request.headers.get("sec-fetch-site") === "cross-site"
    if (origin) {
      try {
        crossSite = crossSite || new URL(origin).origin !== request.nextUrl.origin
      } catch {
        crossSite = true
      }
    }
    if (crossSite) {
      return NextResponse.json({ error: "Cross-site password recovery requests are not allowed." }, { status: 403 })
    }
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "A JSON request body is required." }, { status: 415 })
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 8 * 1024) {
      return NextResponse.json({ error: "Password recovery request is too large." }, { status: 413 })
    }
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid password recovery request." }, { status: 400 })
    }
    const email = String(body.email ?? "").trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }

    const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL
    if (!configuredSiteUrl) {
      console.error("Password recovery requires NEXT_PUBLIC_SITE_URL or NEXTAUTH_URL.")
      return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 })
    }
    const siteUrl = new URL(configuredSiteUrl)
    if (process.env.NODE_ENV === "production" && siteUrl.protocol !== "https:") {
      console.error("Password recovery site URL must use HTTPS in production.")
      return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 })
    }
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/auth/v1/recover?redirect_to=${encodeURIComponent(new URL("/reset-password", siteUrl).toString())}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ email }),
        cache: "no-store",
      }
    )

    if (!response.ok) {
      console.error("Supabase password recovery request failed:", response.status)
      return NextResponse.json({ error: "We could not send the reset email. Please try again or contact support." }, { status: 502 })
    }

    // Return the same success message regardless of whether the address is registered.
    return NextResponse.json({ success: true, message: "If an account exists for this email, a password reset link has been sent." })
  } catch (error) {
    console.error("Password recovery request failed:", error)
    return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 500 })
  }
}
