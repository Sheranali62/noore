import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/rate-limit"
import { prisma } from "@/lib/prisma"
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy"

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
    let crossSite = request.headers.get("sec-fetch-site") === "cross-site"
    if (origin) {
      try {
        crossSite = crossSite || new URL(origin).origin !== request.nextUrl.origin
      } catch {
        crossSite = true
      }
    }
    if (crossSite) {
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

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid registration request." }, { status: 400 })
    }

    const name = String(body.name ?? "").trim().slice(0, 100)
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter your name and a valid email address." }, { status: 400 })
    }
    if (!isStrongPassword(password)) {
      return NextResponse.json({ error: PASSWORD_POLICY_MESSAGE }, { status: 400 })
    }

    const response = await fetch(supabaseUrl.replace(/\/$/, "") + "/auth/v1/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey },
      body: JSON.stringify({ email, password, data: { full_name: name, name } }),
      cache: "no-store",
    })
    const result = await response.json().catch(() => ({}))

    // GoTrue's REST endpoint returns the user object at the response root.
    // Some SDK-shaped responses wrap it in a user property; support both.
    const authUser = result?.user ?? result
    const authUserId = authUser?.id
    const authEmail = typeof authUser?.email === "string" && authUser.email
      ? authUser.email.toLowerCase()
      : email

    if (!response.ok || typeof authUserId !== "string" || !authUserId) {
      console.error("Supabase registration rejected:", response.status, result?.msg || result?.message || result?.error_code || "no user id returned")
      const status = response.status === 429 ? 429 : 400
      return NextResponse.json({
        error: status === 429
          ? "Too many registration attempts. Please try again later."
          : "We could not create your account. If you already registered, verify your email or sign in.",
      }, { status })
    }

    // Supabase Auth is the identity source. Mirror the customer into the
    // storefront database using the email submitted with the successful signup.
    const existingAppUser = await prisma.user.findFirst({
      where: { email: { equals: authEmail, mode: "insensitive" } },
      select: { id: true },
    })

    const user = existingAppUser
      ? await prisma.user.update({
          where: { id: existingAppUser.id },
          data: { name },
          select: { id: true, email: true, name: true },
        })
      : await prisma.user.create({
          data: { email: authEmail, name, role: "CUSTOMER", password: null },
          select: { id: true, email: true, name: true },
        })

    return NextResponse.json({
      message: result?.session
        ? "Your NOORÉ account is ready. You can sign in now."
        : "Your account has been created. Please verify your email using the link we sent you.",
      requiresEmailConfirmation: !result?.session,
      user,
    }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Your account could not be fully prepared. Please try again or sign in if you already registered." }, { status: 500 })
  }
}
