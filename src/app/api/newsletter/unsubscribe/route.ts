import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = String(body.token ?? "").trim()
    if (!token || token.length > 128) return NextResponse.json({ error: "Invalid unsubscribe link." }, { status: 400 })

    const subscriber = await prisma.newsletterSubscriber.findFirst({
      where: { unsubscribeToken: token, active: true },
      select: { id: true },
    })
    if (subscriber) {
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: { active: false, unsubscribeToken: null },
      })
    }
    return NextResponse.json({ success: true, message: "Your email preferences have been updated." })
  } catch (error) {
    console.error("Newsletter unsubscribe failed:", error)
    return NextResponse.json({ error: "Unable to update your email preferences." }, { status: 500 })
  }
}
