import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const token = String(body.token ?? "")
    if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "This unsubscribe link is invalid." }, { status: 400 })
    const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { unsubscribeToken: token }, select: { id: true } })
    if (!subscriber) return NextResponse.json({ error: "This unsubscribe link is invalid or has already been used." }, { status: 404 })
    await prisma.newsletterSubscriber.update({ where: { id: subscriber.id }, data: { active: false, unsubscribeToken: null } })
    return NextResponse.json({ success: true, message: "You have been unsubscribed from NOORÉ emails." })
  } catch (error) {
    console.error("Newsletter unsubscribe failed:", error)
    return NextResponse.json({ error: "Unable to process your request right now." }, { status: 500 })
  }
}
