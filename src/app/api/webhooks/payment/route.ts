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
  if (!secret || secret.length < 32) return NextResponse.json({ error: "Payment webhook is not configured securely." }, { status: 503 })
  if (!authorized(request, secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })

  try {
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "A JSON webhook body is required." }, { status: 415 })
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 16 * 1024) return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 })
    const body = await request.json()
    const orderNumber = String(body.orderNumber ?? "").trim()
    const provider = String(body.provider ?? "").trim().slice(0, 60)
    const providerReference = String(body.providerReference ?? "").trim().slice(0, 180)
    const status = String(body.status ?? "").toUpperCase()
    const amount = Number(body.amount)
    if (!orderNumber || orderNumber.length > 64 || !provider || !providerReference || providerReference.length > 180 || !Number.isFinite(amount) || amount <= 0 || !["PAID", "FAILED", "REFUNDED"].includes(status)) {
      return NextResponse.json({ error: "Invalid payment event." }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true, total: true, paymentStatus: true, status: true } })
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 })
    if (Math.abs(order.total - amount) > 0.01) return NextResponse.json({ error: "Payment amount does not match the order total." }, { status: 409 })
    if (["CANCELLED", "REFUNDED", "RETURNED"].includes(order.status) && status === "PAID") {
      return NextResponse.json({ error: "Payment cannot be marked as paid for a cancelled or refunded order." }, { status: 409 })
    }
    if (order.paymentStatus === "REFUNDED" && status !== "REFUNDED") {
      return NextResponse.json({ error: "This order has already been refunded." }, { status: 409 })
    }
    if (order.paymentStatus === "PAID" && status === "FAILED") {
      return NextResponse.json({ success: true, ignored: true, message: "A confirmed payment cannot be downgraded to failed." })
    }
    const existing = await prisma.paymentTransaction.findUnique({
      where: { provider_providerReference: { provider, providerReference } },
      select: { orderId: true, status: true },
    })
    if (existing && existing.orderId !== order.id) {
      return NextResponse.json({ error: "This payment reference is already linked to another order." }, { status: 409 })
    }
    if (existing && existing.status === status) {
      return NextResponse.json({ success: true, ignored: true, message: "This payment event was already processed." })
    }

    const mapped = status as "PAID" | "FAILED" | "REFUNDED"
    await prisma.$transaction(async tx => {
      await tx.paymentTransaction.upsert({
        where: { provider_providerReference: { provider, providerReference } },
        create: { orderId: order.id, provider, providerReference, amount, currency: "PKR", status: mapped, rawResponse: { eventId: String(body.eventId ?? ""), status: mapped } },
        update: { status: mapped, rawResponse: { eventId: String(body.eventId ?? ""), status: mapped } },
      })
      const paymentUpdate = await tx.order.updateMany({
        where: { id: order.id, paymentStatus: order.paymentStatus },
        data: { paymentStatus: mapped },
      })
      if (paymentUpdate.count !== 1) throw new Error("PAYMENT_STATUS_CONFLICT")
      await tx.orderEvent.create({ data: { orderId: order.id, event: `PAYMENT_${mapped}`, message: `Payment provider ${provider} reported ${mapped.toLowerCase()}.`, metadata: { provider, providerReference } } })
      await tx.auditLog.create({ data: { action: "PAYMENT_WEBHOOK", entityType: "Order", entityId: order.id, details: { provider, providerReference, status: mapped, amount } } })
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === "PAYMENT_STATUS_CONFLICT") {
      return NextResponse.json({ error: "A payment event was processed concurrently. Please retry this event." }, { status: 409 })
    }
    console.error("Payment webhook failed:", error)
    return NextResponse.json({ error: "Unable to process payment event." }, { status: 500 })
  }
}
