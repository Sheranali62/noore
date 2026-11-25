import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/rate-limit"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const databaseLimit = await enforceRateLimit(request, "register", 5, 3600000)
  if (databaseLimit) return databaseLimit
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Registration is temporarily unavailable." }, { status: 503 })
  }

  try {
    const origin = request.headers.get("origin")
    if (origin && new URL(origin).origin !== request.nextUrl.origin) {
      return NextResponse.json({ error: "Cross-site registration is not allowed" }, { status: 403 })
    }
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "A JSON request body is required" }, { status: 415 })
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 16 * 1024) {
      return NextResponse.json({ error: "Registration request is too large" }, { status: 413 })
    }

    const body = await request.json().catch(() => ({}))
    const name = String(body.name ?? "").trim().slice(0, 100)
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter your name and a valid email address." }, { status: 400 })
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters and include a letter and a number." }, { status: 400 })
    }

    const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email, password, data: { full_name: name, name } }),
      cache: "no-store",
    })
    const result = await response.json().catch(() => ({}))
    if (!response.ok || !result.user?.id || !result.user?.email) {
      console.error("Supabase registration failed:", response.status)
      return NextResponse.json({ error: response.status === 429 ? "Too many registration attempts. Please try again later." : "We could not create your account. Check the details or try signing in." }, { status: response.status === 429 ? 429 : 400 })
    }

    const existingAppUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    })
    const user = existingAppUser
      ? await prisma.user.update({
          where: { id: existingAppUser.id },
          data: { name },
          select: { id: true, email: true, name: true },
        })
      : await prisma.user.create({
          data: { email, name, role: "CUSTOMER", password: null },
          select: { id: true, email: true, name: true },
        })

    return NextResponse.json({
      message: result.session
        ? "Your NOORÉ account is ready. You can sign in now."
        : "Your account has been created. Please verify your email using the link we sent you.",
      requiresEmailConfirmation: !result.session,
      user,
    }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Failed to create your account. Please try again." }, { status: 500 })
  }
}
