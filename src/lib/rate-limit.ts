import { createHmac } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function enforceRateLimit(
  request: NextRequest,
  scope: string,
  limit: number,
  windowMs: number,
  identifier = ""
): Promise<NextResponse | null> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown"
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    console.error("Rate limiting requires NEXTAUTH_SECRET.")
    return NextResponse.json({ error: "This service is temporarily unavailable." }, { status: 503 })
  }

  const key = createHmac("sha256", secret).update(`${scope}:${ip}:${identifier.toLowerCase()}`).digest("hex")
  const now = new Date()
  const cutoff = new Date(now.getTime() - windowMs)

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number; windowStart: Date }>>`
      INSERT INTO "RateLimitBucket" ("key", "count", "windowStart", "updatedAt")
      VALUES (${key}, 1, ${now}, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimitBucket"."windowStart" <= ${cutoff} THEN 1
          ELSE "RateLimitBucket"."count" + 1
        END,
        "windowStart" = CASE
          WHEN "RateLimitBucket"."windowStart" <= ${cutoff} THEN ${now}
          ELSE "RateLimitBucket"."windowStart"
        END,
        "updatedAt" = ${now}
      RETURNING "count", "windowStart"
    `
    const count = Number(rows[0]?.count ?? 0)
    if (count <= limit) return null

    const retryAfter = Math.max(1, Math.ceil((new Date(rows[0]?.windowStart ?? now).getTime() + windowMs - now.getTime()) / 1000))
    return NextResponse.json(
      { error: "Too many requests. Please wait a little and try again." },
      { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } }
    )
  } catch (error) {
    console.error("Rate limit check failed:", error)
    return NextResponse.json({ error: "This service is temporarily unavailable. Please try again shortly." }, { status: 503 })
  }
}
