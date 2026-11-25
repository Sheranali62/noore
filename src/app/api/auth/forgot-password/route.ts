import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    console.error("Password recovery requires Supabase URL and anon key.")
    return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 503 })
  }

  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email ?? "").trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }

    const origin = new URL(request.url).origin
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/auth/v1/recover?redirect_to=${encodeURIComponent(`${origin}/reset-password`)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: anonKey },
        body: JSON.stringify({ email }),
        cache: "no-store",
      }
    )

    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      console.error("Supabase password recovery request failed:", response.status, detail.slice(0, 500))
      return NextResponse.json({ error: "We could not send the reset email. Please try again or contact support." }, { status: 502 })
    }

    // Return the same success message regardless of whether the address is registered.
    return NextResponse.json({ success: true, message: "If an account exists for this email, a password reset link has been sent." })
  } catch (error) {
    console.error("Password recovery request failed:", error)
    return NextResponse.json({ error: "Password recovery is temporarily unavailable." }, { status: 500 })
  }
}
