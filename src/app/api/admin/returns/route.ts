import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  const requests = await prisma.returnRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      order: { select: { id: true, orderNumber: true, total: true, paymentMethod: true, paymentStatus: true } },
    },
    take: 200,
  })
  return NextResponse.json({ requests })
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  try {
    const body = await request.json().catch(() => ({}))
    const id = String(body.id ?? "")
    const status = String(body.status ?? "")
    const adminNote = body.adminNote === undefined ? undefined : String(body.adminNote).trim().slice(0, 2000)
    const allowed = ["REQUESTED", "APPROVED", "REJECTED", "PICKUP_SCHEDULED", "RECEIVED", "REFUNDED", "EXCHANGED"]
    if (!id || !allowed.includes(status)) {
      return NextResponse.json({ error: "A valid return request and status are required." }, { status: 400 })
    }

    const current = await prisma.returnRequest.findUnique({
      where: { id },
      select: {
        id: true,
        orderId: true,
        status: true,
        userId: true,
        itemIds: true,
        order: { select: { items: { select: { id: true, productId: true, variantId: true, quantity: true } } } },
      },
    })
    if (!current) return NextResponse.json({ error: "Return request not found." }, { status: 404 })

    const nextStatus: Record<string, string[]> = {
      REQUESTED: ["APPROVED", "REJECTED"],
      APPROVED: ["PICKUP_SCHEDULED", "RECEIVED", "REJECTED"],
      PICKUP_SCHEDULED: ["RECEIVED", "REJECTED"],
      RECEIVED: ["REFUNDED", "EXCHANGED"],
      REJECTED: [],
      REFUNDED: [],
      EXCHANGED: [],
    }
    if (status !== current.status && !nextStatus[current.status]?.includes(status)) {
      return NextResponse.json({ error: "This return request cannot move from its current status to the selected status." }, { status: 409 })
    }

    const result = await prisma.$transaction(async tx => {
      if (status === "RECEIVED" && current.status !== "RECEIVED") {
        const returnedItems = current.order.items.filter(item => current.itemIds.includes(item.id))
        for (const item of returnedItems) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({ where: { id: item.variantId }, select: { stock: true } })
            if (!variant) continue
            await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } })
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                variantId: item.variantId,
                change: item.quantity,
                beforeStock: variant.stock,
                afterStock: variant.stock + item.quantity,
                reason: "Customer return received",
                note: `Return request ${id}`,
                userId: guard.session?.user?.id,
              },
            })
          } else {
            const product = await tx.product.findUnique({ where: { id: item.productId }, select: { stock: true } })
            if (!product) continue
            await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
            await tx.inventoryMovement.create({
              data: {
                productId: item.productId,
                change: item.quantity,
                beforeStock: product.stock,
                afterStock: product.stock + item.quantity,
                reason: "Customer return received",
                note: `Return request ${id}`,
                userId: guard.session?.user?.id,
              },
            })
          }
        }
      }

      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: status as any, ...(adminNote !== undefined ? { adminNote } : {}) },
      })
      if (status === "REFUNDED") {
        await tx.order.update({ where: { id: current.orderId }, data: { paymentStatus: "REFUNDED" } })
      }
      await tx.orderEvent.create({
        data: {
          orderId: current.orderId,
          actorId: guard.session?.user?.id,
          event: `RETURN_${status}`,
          message: adminNote || `Return request status changed to ${status}.`,
          metadata: { returnRequestId: id, returnedItemIds: current.itemIds },
        },
      })
      await tx.auditLog.create({
        data: {
          actorId: guard.session?.user?.id,
          action: "UPDATE_RETURN_REQUEST",
          entityType: "ReturnRequest",
          entityId: id,
          details: { from: current.status, to: status, adminNote: adminNote ?? null },
        },
      })
      return updated
    })
    return NextResponse.json({ request: result })
  } catch (error) {
    console.error("Return request update failed:", error)
    return NextResponse.json({ error: "Unable to update return request." }, { status: 500 })
  }
}
