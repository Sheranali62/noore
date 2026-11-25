import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from "@/lib/password-policy"

export const dynamic = "force-dynamic"

function isCrossSite(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (request.headers.get("sec-fetch-site") === "cross-site") return true
  if (!origin) return false
  try {
    return new URL(origin).origin !== request.nextUrl.origin
  } catch {
    return true
  }
}

export async function POST(request: NextRequest) {
  if (isCrossSite(request)) {
    return NextResponse.json({ error: "Cross-site password reset requests are not allowed." }, { status: 403 })
  }

  const authorization = request.headers.get("authorization") ?? ""
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : ""
  if (!accessToken || accessToken.length > 8192) {
    return NextResponse.json({ error: "This password reset link is invalid or has expired." }, { status: 401 })
  }

  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: "A JSON request body is required." }, { status: 415 })
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > 8 * 1024) {
    return NextResponse.json({ error: "Password reset request is too large." }, { status: 413 })
  }

  const body = await request.json().catch(() => null)
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid password reset request." }, { status: 400 })
  }
  const password = typeof body.password === "string" ? body.password : ""
  if (!isStrongPassword(password)) {
    return NextResponse.json({ error: PASSWORD_POLICY_MESSAGE }, { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Password reset is temporarily unavailable." }, { status: 503 })
  }

  try {
    const baseUrl = new URL(supabaseUrl)
    if (process.env.NODE_ENV === "production" && baseUrl.protocol !== "https:") {
      return NextResponse.json({ error: "Password reset is not securely configured." }, { status: 503 })
    }
    const authUrl = baseUrl.toString().replace(/\/$/, "")
    const authHeaders = { apikey: anonKey, Authorization: `Bearer ${accessToken}` }

    const verified = await fetch(`${authUrl}/auth/v1/user`, {
      method: "GET",
      headers: authHeaders,
      cache: "no-store",
    })
    if (!verified.ok) {
      return NextResponse.json({ error: "This password reset link is invalid or has expired." }, { status: 401 })
    }

    const authUser = await verified.json().catch(() => null)
    const tokenParts = accessToken.split(".")
    if (tokenParts.length !== 3) {
      return NextResponse.json({ error: "This password reset link is invalid or has expired." }, { status: 401 })
    }
    let tokenPayload: any
    try {
      tokenPayload = JSON.parse(Buffer.from(tokenParts[1], "base64url").toString("utf8"))
    } catch {
      return NextResponse.json({ error: "This password reset link is invalid or has expired." }, { status: 401 })
    }
    const authMethods = Array.isArray(tokenPayload.amr) ? tokenPayload.amr : []
    const isRecoverySession = authMethods.some((entry: unknown) =>
      entry === "recovery" ||
      (typeof entry === "object" && entry !== null && "method" in entry && entry.method === "recovery")
    )
    if (!isRecoverySession || tokenPayload.aud !== "authenticated" || tokenPayload.sub !== authUser?.id) {
      return NextResponse.json({ error: "A verified password recovery link is required." }, { status: 403 })
    }
    const email = String(authUser?.email ?? "").trim().toLowerCase()
    if (!email || email.length > 254) {
      return NextResponse.json({ error: "This password reset link is invalid or has expired." }, { status: 401 })
    }

    const updated = await fetch(`${authUrl}/auth/v1/user`, {
      method: "PUT",
      headers: { ...authHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      cache: "no-store",
    })
    if (!updated.ok) {
      return NextResponse.json(
        { error: "The password could not be updated. The reset link may have expired." },
        { status: updated.status === 429 ? 429 : updated.status >= 500 ? 502 : 400 }
      )
    }

    let sessionsRevoked = true
    try {
      const appUser = await prisma.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        select: { id: true },
      })
      if (appUser) {
        // Prisma's @updatedAt timestamp changes, invalidating existing NOORÉ JWT sessions.
        await prisma.user.update({
          where: { id: appUser.id },
          data: { password: null },
          select: { id: true },
        })
      }
    } catch (error) {
      sessionsRevoked = false
      console.error("Password changed but NOORÉ session revocation failed:", error)
    }

    return NextResponse.json(
      { success: true, sessionsRevoked },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    console.error("Password reset failed:", error)
    return NextResponse.json({ error: "Password reset is temporarily unavailable." }, { status: 500 })
  }
}
