import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendNewsletterWelcomeEmail } from "@/lib/notifications"

export const dynamic = "force-dynamic"

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = normalizeEmail(body.email)

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }

    const unsubscribeToken = randomBytes(32).toString("hex")
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { active: true, unsubscribeToken },
      create: { email, active: true, unsubscribeToken },
    })

    void sendNewsletterWelcomeEmail({ to: email, unsubscribeToken }).catch(error => {
      console.error("Newsletter welcome email failed:", error)
    })

    return NextResponse.json({ success: true, message: "Thank you for subscribing." })
  } catch (error) {
    console.error("Newsletter subscription failed:", error)
    return NextResponse.json({ error: "We could not save your subscription. Please try again." }, { status: 500 })
  }
}
