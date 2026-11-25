import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  const requests = await prisma.returnRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { order: { select: { id: true, orderNumber: true, total: true, status: true, items: { include: { product: { select: { name: true, images: true } }, variant: { select: { color: true, size: true } } } } } },
  })
  const eligibleOrders = await prisma.order.findMany({
    where: { userId: session.user.id, status: "DELIVERED" },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      updatedAt: true,
      items: { select: { id: true, quantity: true, product: { select: { name: true, images: true } }, variant: { select: { color: true, size: true } } } },
    },
    take: 50,
  })
  return NextResponse.json({ requests, eligibleOrders })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Please sign in to request a return." }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const orderId = String(body.orderId ?? "")
    const reason = String(body.reason ?? "").trim()
    const details = String(body.details ?? "").trim().slice(0, 2000)
    const itemIds = Array.isArray(body.itemIds) ? Array.from(new Set(body.itemIds.map((id: unknown) => String(id)))) : []
    const allowedReasons = ["Wrong item received", "Damaged or defective", "Size or fit issue", "Different from description", "Other"]

    if (!orderId || !allowedReasons.includes(reason) || !itemIds.length) {
      return NextResponse.json({ error: "Select an order, return reason and at least one item." }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: { items: { select: { id: true } } },
    })
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 })
    if (order.status !== "DELIVERED") return NextResponse.json({ error: "Returns can only be requested for delivered orders." }, { status: 409 })
    const validIds = new Set(order.items.map(item => item.id))
    if (itemIds.some(id => !validIds.has(id))) return NextResponse.json({ error: "One or more selected items do not belong to this order." }, { status: 400 })

    const existing = await prisma.returnRequest.findFirst({
      where: { orderId, userId: session.user.id, status: { in: ["REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "RECEIVED"] } },
      select: { id: true },
    })
    if (existing) return NextResponse.json({ error: "A return request is already open for this order." }, { status: 409 })

    const result = await prisma.$transaction(async tx => {
      const created = await tx.returnRequest.create({
        data: { orderId, userId: session.user.id, reason, details: details || null, itemIds },
      })
      await tx.orderEvent.create({
        data: { orderId, actorId: session.user.id, event: "RETURN_REQUESTED", message: "Customer submitted a return request.", metadata: { returnRequestId: created.id, itemIds } },
      })
      return created
    })
    return NextResponse.json({ request: result, message: "Your return request has been submitted." }, { status: 201 })
  } catch (error) {
    console.error("Return request creation failed:", error)
    return NextResponse.json({ error: "Unable to submit your return request." }, { status: 500 })
  }
}
