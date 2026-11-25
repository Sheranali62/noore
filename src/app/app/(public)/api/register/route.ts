import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { enforceRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const rateLimit = await enforceRateLimit(request, "legacy-registration", 5, 3600000)
  if (rateLimit) return rateLimit

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

    const body = await request.json()
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid registration request" }, { status: 400 })
    }

    const name = String(body.name ?? "").trim()
    const email = String(body.email ?? "").trim().toLowerCase()
    const password = String(body.password ?? "")

    if (!name || name.length > 100 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Enter your name and a valid email address." }, { status: 400 })
    }
    if (password.length < 8 || password.length > 128 || !/[A-Za-z]/.test(password) || !/\\d/.test(password)) {
      return NextResponse.json({ error: "Password must be at least 8 characters and include a letter and a number." }, { status: 400 })
    }

    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    })
    if (existingUser) {
      return NextResponse.json({ error: "An account already exists for this email. Please sign in." }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: "CUSTOMER" },
      select: { id: true, email: true, name: true },
    })

    return NextResponse.json(
      { message: "Account created successfully. You can now sign in.", user },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Legacy registration failed:", error)
    return NextResponse.json({ error: "Unable to create your account. Please try again." }, { status: 500 })
  }
}
