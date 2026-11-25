import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (
    (origin && new URL(origin).origin !== request.nextUrl.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return NextResponse.json({ error: "Cross-site password reset confirmation is not allowed." }, { status: 403 })
  }

  const authorization = request.headers.get("authorization") ?? ""
  const accessToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : ""
  if (!accessToken || accessToken.length > 8192) {
    return NextResponse.json({ error: "A valid password recovery session is required." }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Password reset confirmation is temporarily unavailable." }, { status: 503 })
  }

  try {
    const verified = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/user`, {
      method: "GET",
      headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    })
    if (!verified.ok) {
      return NextResponse.json({ error: "The password recovery session has expired." }, { status: 401 })
    }

    const authUser = await verified.json().catch(() => null)
    const email = String(authUser?.email ?? "").trim().toLowerCase()
    if (!email || email.length > 254) {
      return NextResponse.json({ error: "The password recovery session is invalid." }, { status: 401 })
    }

    const appUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    })
    if (appUser) {
      // Updating the account row revokes existing NOORÉ JWT sessions on their next read.
      await prisma.user.update({
        where: { id: appUser.id },
        data: { password: null },
        select: { id: true },
      })
    }

    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    console.error("Password reset session revocation failed:", error)
    return NextResponse.json({ error: "Password reset confirmation is temporarily unavailable." }, { status: 500 })
  }
}
