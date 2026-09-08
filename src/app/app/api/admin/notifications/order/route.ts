import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { sendOrderStatusEmail, OrderNotificationStatus } from "@/lib/notifications"

export async function POST(request: NextRequest) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  const body = await request.json()
  const order = await prisma.order.findUnique({ where: { id: body.orderId }, include: { user: { select: { name: true, email: true } } } })
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })
  const result = await sendOrderStatusEmail({ to: order.user.email, customerName: order.user.name, orderNumber: order.orderNumber, status: order.status as OrderNotificationStatus, trackingNumber: order.trackingNumber, courier: order.courier })
  return NextResponse.json(result)
}
