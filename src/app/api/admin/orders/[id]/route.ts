import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"] as const
const PAYMENT_STATUSES = ["UNPAID", "PAID", "FAILED", "REFUNDED"] as const

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (response) return response

  try {
    const body = await request.json()
    const status = body.status as typeof ORDER_STATUSES[number] | undefined
    const paymentStatus = body.paymentStatus as typeof PAYMENT_STATUSES[number] | undefined
    const trackingNumber = body.trackingNumber === null ? null : String(body.trackingNumber ?? "").trim() || null
    const courier = body.courier === null ? null : String(body.courier ?? "").trim() || null
    if (status && !ORDER_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid order status" }, { status: 400 })
    if (paymentStatus && !PAYMENT_STATUSES.includes(paymentStatus)) return NextResponse.json({ error: "Invalid payment status" }, { status: 400 })
    if (!status && !paymentStatus && body.trackingNumber === undefined && body.courier === undefined) return NextResponse.json({ error: "No changes supplied" }, { status: 400 })

    const order = await prisma.$transaction(async tx => {
      const current = await tx.order.findUnique({ where: { id: params.id }, include: { items: true } })
      if (!current) throw new Error("NOT_FOUND")
      const nextStatus = status ?? current.status
      const wasCancelled = current.status === "CANCELLED" || current.status === "RETURNED" || current.status === "REFUNDED"
      const willBeCancelled = nextStatus === "CANCELLED" || nextStatus === "RETURNED" || nextStatus === "REFUNDED"

      if (!wasCancelled && willBeCancelled) {
        for (const item of current.items) {
          if (item.variantId) await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } })
          else await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
        }
      }
      if (wasCancelled && !willBeCancelled) {
        for (const item of current.items) {
          if (item.variantId) {
            const result = await tx.productVariant.updateMany({ where: { id: item.variantId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
            if (result.count !== 1) throw new Error("INSUFFICIENT_STOCK")
          } else {
            const result = await tx.product.updateMany({ where: { id: item.productId, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } })
            if (result.count !== 1) throw new Error("INSUFFICIENT_STOCK")
          }
        }
      }

      return tx.order.update({
        where: { id: params.id },
        data: {
          status: nextStatus,
          paymentStatus: paymentStatus ?? (nextStatus === "REFUNDED" ? "REFUNDED" : undefined),
          trackingNumber: body.trackingNumber !== undefined ? trackingNumber : undefined,
          courier: body.courier !== undefined ? courier : undefined,
        },
        include: { user: { select: { name: true, email: true } }, address: true, items: { include: { product: true, variant: true } } },
      })
    })
    return NextResponse.json({ order })
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ error: "Order not found" }, { status: 404 })
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") return NextResponse.json({ error: "Not enough stock to reopen this order" }, { status: 409 })
    console.error("Error updating order:", error)
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 })
  }
}
