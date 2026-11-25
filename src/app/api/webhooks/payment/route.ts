import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function authorized(request: NextRequest, secret: string) {
  const supplied = request.headers.get("x-noore-payment-secret") || ""
  const a = Buffer.from(supplied)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Payment webhook is not configured." }, { status: 503 })
  if (!authorized(request, secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })

  try {
    const body = await request.json()
    const orderNumber = String(body.orderNumber ?? "").trim()
    const provider = String(body.provider ?? "").trim().slice(0, 60)
    const providerReference = String(body.providerReference ?? "").trim().slice(0, 180)
    const status = String(body.status ?? "").toUpperCase()
    const amount = Number(body.amount)
    if (!orderNumber || !provider || !providerReference || !Number.isFinite(amount) || !["PAID", "FAILED", "REFUNDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid payment event." }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true, total: true, paymentStatus: true } })
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 })
    if (Math.abs(order.total - amount) > 0.01) return NextResponse.json({ error: "Payment amount does not match the order total." }, { status: 409 })
    if (order.paymentStatus === "REFUNDED" && status !== "REFUNDED") {
      return NextResponse.json({ error: "This order has already been refunded." }, { status: 409 })
    }
    const existing = await prisma.paymentTransaction.findUnique({
      where: { provider_providerReference: { provider, providerReference } },
      select: { orderId: true, status: true },
    })
    if (existing && existing.orderId !== order.id) {
      return NextResponse.json({ error: "This payment reference is already linked to another order." }, { status: 409 })
    }

    const mapped = status as "PAID" | "FAILED" | "REFUNDED"
    await prisma.$transaction(async tx => {
      await tx.paymentTransaction.upsert({
        where: { provider_providerReference: { provider, providerReference } },
        create: { orderId: order.id, provider, providerReference, amount, currency: "PKR", status: mapped, rawResponse: { eventId: String(body.eventId ?? ""), status: mapped } },
        update: { status: mapped, rawResponse: { eventId: String(body.eventId ?? ""), status: mapped } },
      })
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: mapped } })
      await tx.orderEvent.create({ data: { orderId: order.id, event: `PAYMENT_${mapped}`, message: `Payment provider ${provider} reported ${mapped.toLowerCase()}.`, metadata: { provider, providerReference } } })
      await tx.auditLog.create({ data: { action: "PAYMENT_WEBHOOK", entityType: "Order", entityId: order.id, details: { provider, providerReference, status: mapped, amount } } })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Payment webhook failed:", error)
    return NextResponse.json({ error: "Unable to process payment event." }, { status: 500 })
  }
}
