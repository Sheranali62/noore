import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body.email ?? "").trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }

    const limited = await enforceRateLimit(request, "password-recovery", 5, 15 * 60 * 1000, email)
    if (limited) return limited

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) {
      console.error("Password recovery unavailable: Supabase Auth is not configured.")
      return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 })
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || request.nextUrl.origin).replace(/\/$/, "")
    const endpoint = new URL("/auth/v1/recover", supabaseUrl)
    endpoint.searchParams.set("redirect_to", `${siteUrl}/reset-password`)

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email }),
      cache: "no-store",
    })

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      console.error("Supabase password recovery request failed:", response.status, detail.slice(0, 300))
      return NextResponse.json({ error: "We could not send a reset email. Please try again later." }, { status: 502 })
    }

    // Supabase handles account enumeration protection and sends the recovery email.
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password recovery failed:", error)
    return NextResponse.json({ error: "We could not process your request. Please try again." }, { status: 500 })
  }
}
