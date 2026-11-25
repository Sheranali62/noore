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
    if (!id || !allowed.includes(status)) return NextResponse.json({ error: "A valid return request and status are required." }, { status: 400 })
    const current = await prisma.returnRequest.findUnique({ where: { id }, select: { id: true, orderId: true, status: true, userId: true } })
    if (!current) return NextResponse.json({ error: "Return request not found." }, { status: 404 })
    const result = await prisma.$transaction(async tx => {
      const updated = await tx.returnRequest.update({
        where: { id },
        data: { status: status as any, ...(adminNote !== undefined ? { adminNote } : {}) },
      })
      await tx.orderEvent.create({
        data: { orderId: current.orderId, actorId: guard.session?.user?.id, event: `RETURN_${status}`, message: adminNote || `Return request status changed to ${status}.`, metadata: { returnRequestId: id } },
      })
      await tx.auditLog.create({
        data: { actorId: guard.session?.user?.id, action: "UPDATE_RETURN_REQUEST", entityType: "ReturnRequest", entityId: id, details: { from: current.status, to: status, adminNote: adminNote ?? null } },
      })
      return updated
    })
    return NextResponse.json({ request: result })
  } catch (error) {
    console.error("Return request update failed:", error)
    return NextResponse.json({ error: "Unable to update return request." }, { status: 500 })
  }
}
