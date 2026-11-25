import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

export async function PATCH(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (
    (origin && new URL(origin).origin !== request.nextUrl.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return NextResponse.json({ error: "Cross-site profile updates are not allowed." }, { status: 403 })
  }

  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rateLimit = await enforceRateLimit(request, "account-profile-update", 10, 60 * 60 * 1000, session.user.id)
  if (rateLimit) return rateLimit

  try {
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "A JSON request body is required." }, { status: 415 })
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 8 * 1024) return NextResponse.json({ error: "Profile request is too large." }, { status: 413 })

    const body = await request.json()
    const name = typeof body.name === "string" ? body.name.trim() : ""
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""

    if (!name || name.length > 100 || !email || email.length > 254) {
      return NextResponse.json({ error: "Enter a valid name and email address." }, { status: 400 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, updatedAt: true },
    })
    if (!currentUser) return NextResponse.json({ error: "Account not found." }, { status: 404 })
    if (email !== currentUser.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Email changes require a separate verification process. Please contact NOORÉ support." },
        { status: 409 }
      )
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      // Keep the session-version timestamp unchanged for ordinary name edits.
      data: { name, updatedAt: currentUser.updatedAt },
      select: { id: true, name: true, email: true },
    })

    return NextResponse.json(
      { user },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    console.error("Profile update failed", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
