import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import { sendOrderStatusEmail } from "@/lib/notifications"

export const dynamic = "force-dynamic"

function authorized(request: NextRequest, secret: string) {
  const supplied = request.headers.get("x-noore-courier-secret") || ""
  const a = Buffer.from(supplied)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}

const STATUS_MAP: Record<string, string> = {
  BOOKED: "SHIPPED",
  PICKED_UP: "SHIPPED",
  IN_TRANSIT: "SHIPPED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
}

export async function POST(request: NextRequest) {
  const secret = process.env.COURIER_WEBHOOK_SECRET
  if (!secret) return NextResponse.json({ error: "Courier webhook is not configured." }, { status: 503 })
  if (!authorized(request, secret)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 })

  try {
    const body = await request.json()
    const orderNumber = String(body.orderNumber ?? "").trim()
    const trackingNumber = String(body.trackingNumber ?? "").trim()
    const courier = String(body.courier ?? "").trim().slice(0, 100)
    const providerStatus = String(body.status ?? "").toUpperCase()
    const status = STATUS_MAP[providerStatus]
    if (!orderNumber || !trackingNumber || !status) return NextResponse.json({ error: "Invalid courier event." }, { status: 400 })

    const order = await prisma.order.findUnique({ where: { orderNumber }, select: { id: true, orderNumber: true, status: true, trackingNumber: true, user: { select: { name: true, email: true } } } })
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 })
    if (order.status === "CANCELLED" || order.status === "REFUNDED" || order.status === "RETURNED") return NextResponse.json({ error: "This order is no longer active for delivery updates." }, { status: 409 })
    const deliveryRank: Record<string, number> = { PENDING: 0, CONFIRMED: 1, PROCESSING: 2, PACKED: 3, SHIPPED: 4, OUT_FOR_DELIVERY: 5, DELIVERED: 6 }
    if ((deliveryRank[order.status] ?? -1) > deliveryRank[status]) {
      return NextResponse.json({ success: true, ignored: true, message: "A newer delivery status is already recorded." })
    }

    await prisma.$transaction(async tx => {
      await tx.order.update({ where: { id: order.id }, data: { status: status as any, trackingNumber, ...(courier ? { courier } : {}) } })
      await tx.orderEvent.create({ data: { orderId: order.id, event: `COURIER_${providerStatus}`, message: courier ? `${courier}: ${providerStatus.replaceAll("_", " ").toLowerCase()}.` : `Courier update: ${providerStatus.replaceAll("_", " ").toLowerCase()}.`, metadata: { trackingNumber, courier, providerStatus } } })
      await tx.auditLog.create({ data: { action: "COURIER_WEBHOOK", entityType: "Order", entityId: order.id, details: { trackingNumber, courier, providerStatus } } })
    })
    if (order.user?.email && order.status !== status) {
      void sendOrderStatusEmail({
        to: order.user.email,
        customerName: order.user.name,
        orderNumber: order.orderNumber,
        status: status as any,
        trackingNumber,
        courier,
      }).catch(error => console.error("Courier status email failed:", error))
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Courier webhook failed:", error)
    return NextResponse.json({ error: "Unable to process courier event." }, { status: 500 })
  }
}
