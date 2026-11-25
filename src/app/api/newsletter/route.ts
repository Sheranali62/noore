import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = String(body.email ?? "").trim().toLowerCase()

    if (!validEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
    }

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email },
      update: {},
      select: { id: true },
    })

    return NextResponse.json({ success: true, message: "Thank you for subscribing to NOORÉ." })
  } catch (error) {
    console.error("Newsletter subscription failed:", error)
    return NextResponse.json({ error: "We could not complete your subscription. Please try again." }, { status: 500 })
  }
}
