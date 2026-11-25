import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
const STATUSES = ["REQUESTED", "APPROVED", "REJECTED", "PICKUP_SCHEDULED", "RECEIVED", "REFUNDED", "EXCHANGED"] as const

export async function GET() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  try {
    const requests = await prisma.returnRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      include: {
        order: {
          select: {
            id: true, orderNumber: true, total: true, status: true,
            items: { select: { id: true, product: { select: { name: true } }, variant: { select: { color: true, size: true } } } },
          },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    })
    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Admin return requests load failed:", error)
    return NextResponse.json({ error: "Unable to load return requests." }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  try {
    const body = await request.json()
    const id = String(body.id ?? "")
    const status = String(body.status ?? "")
    const adminNote = String(body.adminNote ?? "").trim().slice(0, 1500)
    const refundAmount = body.refundAmount === "" || body.refundAmount == null ? null : Number(body.refundAmount)
    if (!id || !STATUSES.includes(status as typeof STATUSES[number])) {
      return NextResponse.json({ error: "A valid request and status are required." }, { status: 400 })
    }
    if (refundAmount !== null && (!Number.isFinite(refundAmount) || refundAmount < 0)) {
      return NextResponse.json({ error: "Refund amount must be zero or greater." }, { status: 400 })
    }

    const existing = await prisma.returnRequest.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Request not found." }, { status: 404 })

    const updated = await prisma.$transaction(async tx => {
      const saved = await tx.returnRequest.update({
        where: { id },
        data: { status: status as typeof STATUSES[number], adminNote: adminNote || null, ...(refundAmount !== null ? { refundAmount } : {}) },
      })
      await tx.orderEvent.create({
        data: { orderId: existing.orderId, actorId: guard.session?.user?.id || null, event: "EXCHANGE_REQUEST_UPDATED", message: `Request status changed to ${status}.`, metadata: { returnRequestId: id, status, adminNote: adminNote || null, refundAmount } },
      })
      await tx.auditLog.create({
        data: { actorId: guard.session?.user?.id || null, action: "RETURN_REQUEST_UPDATED", entityType: "ReturnRequest", entityId: id, details: { status, adminNote: adminNote || null, refundAmount } },
      })
      return saved
    })

    return NextResponse.json({ request: updated })
  } catch (error) {
    console.error("Admin return request update failed:", error)
    return NextResponse.json({ error: "Unable to update this request." }, { status: 500 })
  }
}
