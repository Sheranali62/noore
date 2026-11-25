import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIp, enforceRateLimit } from "@/lib/rate-limit"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

export async function POST(request: NextRequest) {
  const databaseLimit = await enforceRateLimit(request, "newsletter", 10, 3600000)
  if (databaseLimit) return databaseLimit
  const rate = checkRateLimit(`newsletter:${getClientIp(request)}`, 5, 3600000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds), "Cache-Control": "no-store" } }
    )
  }
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email ?? "").trim().toLowerCase()
    if (!validEmail(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })

    const token = randomBytes(32).toString("hex")
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, active: true, unsubscribeToken: token },
      update: { active: true, unsubscribeToken: token },
      select: { id: true },
    })

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.EMAIL_FROM
    if (apiKey && from) {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
      const unsubscribeUrl = `${origin.replace(/\/$/, "")}/newsletter/unsubscribe?token=${token}`
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from,
            to: [email],
            subject: "Welcome to the NOORÉ world",
            html: `<div style="font-family:Arial,sans-serif;color:#343a30;max-width:560px;margin:auto;padding:32px"><h1 style="letter-spacing:5px">NOORÉ</h1><p>Thank you for joining our world.</p><p>You'll hear about new collections, considered style and exclusive offers.</p><p style="font-size:12px;color:#777">If you no longer wish to receive these emails, <a href="${unsubscribeUrl}">unsubscribe here</a>.</p></div>`,
          }),
        })
        if (!response.ok) console.error("Newsletter welcome email failed:", response.status, (await response.text()).slice(0, 300))
      } catch (error) {
        console.error("Newsletter welcome email could not be sent:", error)
      }
    }

    return NextResponse.json({ success: true, message: "Thank you for subscribing to NOORÉ." })
  } catch (error) {
    console.error("Newsletter subscription failed:", error)
    return NextResponse.json({ error: "We could not complete your subscription. Please try again." }, { status: 500 })
  }
}
