import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function registerCustomer(request: NextRequest) {
  try {
    const body = await request.json()
    const name = String(body.name ?? "").trim().slice(0, 120)
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter your name and a valid email address." }, { status: 400 })
    }
    if (password.length < 8 || password.length > 128) {
      return NextResponse.json({ error: "Password must contain at least 8 characters." }, { status: 400 })
    }

    const limited = await enforceRateLimit(request, "register", 5, 60 * 60 * 1000, email)
    if (limited) return limited

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) {
      console.error("Customer registration unavailable: Supabase Auth is not configured.")
      return NextResponse.json({ error: "Registration is temporarily unavailable." }, { status: 503 })
    }

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || request.nextUrl.origin).replace(/\/$/, "")
    const endpoint = new URL("/auth/v1/signup", supabaseUrl)
    endpoint.searchParams.set("redirect_to", `${siteUrl}/login?registered=true`)
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email, password, data: { full_name: name, name } }),
      cache: "no-store",
    })
    const result = await response.json().catch(() => ({}))

    const authUser = result.user || result
    const duplicateIdentity = Array.isArray(authUser.identities) && authUser.identities.length === 0
    if (!response.ok || !authUser.id || duplicateIdentity) {
      const message = String(result.msg || result.message || result.error_description || result.error || "")
      if (/already|registered|exists/i.test(message)) {
        return NextResponse.json({ error: "An account with this email may already exist. Please sign in or reset your password." }, { status: 409 })
      }
      console.error("Supabase customer registration failed:", response.status, message.slice(0, 250))
      return NextResponse.json({ error: "We could not create your account. Please check your details and try again." }, { status: 400 })
    }

    const requiresEmailConfirmation = !result.session && !result.access_token
    const user = await prisma.user.upsert({
      where: { email },
      update: { name },
      create: { email, name, password: null, role: "CUSTOMER" },
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json({
      message: requiresEmailConfirmation ? "Account created. Please check your email to confirm your address." : "Account created successfully.",
      requiresEmailConfirmation,
      user,
    }, { status: 201 })
  } catch (error) {
    console.error("Customer registration failed:", error)
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 })
  }
}
