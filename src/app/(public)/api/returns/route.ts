import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
const WINDOW_DAYS = 7
const ACTIVE_REQUEST_STATUSES = ["REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "RECEIVED"] as const

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 })

  try {
    const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const [requests, orders] = await Promise.all([
      prisma.returnRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: { order: { select: { orderNumber: true, status: true } } },
      }),
      prisma.order.findMany({
        where: { userId, status: "DELIVERED", updatedAt: { gte: cutoff } },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true, orderNumber: true, updatedAt: true,
          items: { select: { id: true, quantity: true, product: { select: { name: true } }, variant: { select: { color: true, size: true } } } },
        },
      }),
    ])

    const activeRequests = await prisma.returnRequest.findMany({
      where: { userId, status: { in: [...ACTIVE_REQUEST_STATUSES] } },
      select: { itemIds: true },
    })
    const alreadyRequested = new Set(activeRequests.flatMap(item => item.itemIds))

    return NextResponse.json({
      requests,
      eligibleOrders: orders.map(order => ({
        ...order,
        items: order.items.filter(item => !alreadyRequested.has(item.id)),
      })).filter(order => order.items.length > 0),
      windowDays: WINDOW_DAYS,
    }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Load return requests failed:", error)
    return NextResponse.json({ error: "Unable to load return requests." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 })

  try {
    const body = await request.json()
    const orderId = String(body.orderId ?? "").trim()
    const reason = String(body.reason ?? "").trim().slice(0, 100)
    const details = String(body.details ?? "").trim().slice(0, 1500)
    const itemIds: string[] = Array.isArray(body.itemIds) ? Array.from(new Set((body.itemIds as unknown[]).map((id) => String(id)))) : []
    const evidence: string[] = Array.isArray(body.evidence) ? (body.evidence as unknown[]).map(value => String(value)) : []
    const validEvidence = evidence.length <= 5 && evidence.every(value => {
      try {
        const url = new URL(value)
        return url.protocol === "https:" && url.hostname.endsWith("blob.vercel-storage.com")
      } catch { return false }
    })

    if (!validEvidence) return NextResponse.json({ error: "Evidence must be uploaded images from NOORÉ's secure image storage (up to 5)." }, { status: 400 })
    if (!orderId || !reason || itemIds.length === 0 || itemIds.length > 20) {
      return NextResponse.json({ error: "Choose an order, reason and at least one item." }, { status: 400 })
    }

    const cutoff = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000)
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, status: "DELIVERED", updatedAt: { gte: cutoff } },
      include: { items: { select: { id: true } } },
    })
    if (!order) return NextResponse.json({ error: "This order is not eligible. Exchange requests must be submitted within 7 days of delivery." }, { status: 403 })

    const validItemIds = new Set(order.items.map(item => item.id))
    if (itemIds.some(id => !validItemIds.has(id))) {
      return NextResponse.json({ error: "One or more selected items do not belong to this order." }, { status: 400 })
    }

    const previous = await prisma.returnRequest.findMany({
      where: { userId, orderId, status: { in: [...ACTIVE_REQUEST_STATUSES] } },
      select: { itemIds: true },
    })
    const alreadyRequested = new Set(previous.flatMap(item => item.itemIds))
    if (itemIds.some(id => alreadyRequested.has(id))) {
      return NextResponse.json({ error: "A request is already open for one or more selected items." }, { status: 409 })
    }

    const result = await prisma.$transaction(async tx => {
      const created = await tx.returnRequest.create({
        data: { orderId, userId, reason, details: details || null, itemIds, evidence },
      })
      await tx.orderEvent.create({
        data: { orderId, actorId: userId, event: "EXCHANGE_REQUESTED", message: "Customer submitted an exchange or issue request.", metadata: { returnRequestId: created.id, reason, itemIds } },
      })
      return created
    })

    return NextResponse.json({ success: true, request: result }, { status: 201 })
  } catch (error) {
    console.error("Create return request failed:", error)
    return NextResponse.json({ error: "Unable to submit your request. Please try again." }, { status: 500 })
  }
}
