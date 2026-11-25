import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/rate-limit"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 })
  }

  const requests = await prisma.returnRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          items: {
            include: {
              product: { select: { name: true, images: true } },
              variant: { select: { color: true, size: true } },
            },
          },
        },
      },
    },
  })

  const returnCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const eligibleOrders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      status: "DELIVERED",
      OR: [
        { orderEvents: { some: { event: "ORDER_DELIVERED", createdAt: { gte: returnCutoff } } } },
        { orderEvents: { none: { event: "ORDER_DELIVERED" } }, updatedAt: { gte: returnCutoff } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      updatedAt: true,
      items: {
        select: {
          id: true,
          quantity: true,
          product: { select: { name: true, images: true } },
          variant: { select: { color: true, size: true } },
        },
      },
    },
    take: 50,
  })

  return NextResponse.json({ requests, eligibleOrders }, { headers: { "Cache-Control": "private, no-store, max-age=0" } })
}

export async function POST(request: NextRequest) {
  const databaseLimit = await enforceRateLimit(request, "return-request", 8, 3600000)
  if (databaseLimit) return databaseLimit
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to request a return." }, { status: 401 })
  }

  try {
    const origin = request.headers.get("origin")
    if (
      (origin && new URL(origin).origin !== request.nextUrl.origin) ||
      request.headers.get("sec-fetch-site") === "cross-site"
    ) {
      return NextResponse.json({ error: "Cross-site return requests are not allowed." }, { status: 403 })
    }
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "A JSON request body is required." }, { status: 415 })
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 32 * 1024) {
      return NextResponse.json({ error: "Return request is too large." }, { status: 413 })
    }
    const body = await request.json().catch(() => ({}))
    const orderId = String(body.orderId ?? "")
    const reason = String(body.reason ?? "").trim()
    const details = String(body.details ?? "").trim().slice(0, 2000)
    const itemIds: string[] = Array.isArray(body.itemIds)
      ? Array.from(new Set<string>(body.itemIds.map((id: unknown) => String(id))))
      : []
    const evidence: string[] = Array.isArray(body.evidence) ? body.evidence.map((value: unknown) => String(value)) : []
    const allowedReasons = [
      "Wrong item received",
      "Damaged or defective",
      "Size or fit issue",
      "Different from description",
      "Other",
    ]

    if (!orderId || orderId.length > 128 || !allowedReasons.includes(reason) || !itemIds.length || evidence.length > 5) {
      return NextResponse.json({ error: "Select an order, return reason and at least one item." }, { status: 400 })
    }

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: { items: { select: { id: true } }, orderEvents: { where: { event: "ORDER_DELIVERED" }, orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
    })
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 })
    if (order.status !== "DELIVERED") {
      return NextResponse.json({ error: "Returns can only be requested for delivered orders." }, { status: 409 })
    }
    const deliveredAt = order.orderEvents[0]?.createdAt ?? order.updatedAt
    if (Date.now() - deliveredAt.getTime() > 7 * 24 * 60 * 60 * 1000) {
      return NextResponse.json({ error: "The 7-day return window for this order has ended." }, { status: 409 })
    }

    const validEvidence = evidence.every(value => {
      try {
        const url = new URL(value)
        return url.protocol === "https:" &&
          url.hostname.endsWith(".blob.vercel-storage.com") &&
          url.pathname.startsWith(`/noore/returns/${session.user.id}/`)
      } catch {
        return false
      }
    })
    if (!validEvidence) return NextResponse.json({ error: "Return evidence must be uploaded using the provided image uploader." }, { status: 400 })

    const validIds = new Set(order.items.map(item => item.id))
    if (itemIds.some(id => !validIds.has(id))) {
      return NextResponse.json({ error: "One or more selected items do not belong to this order." }, { status: 400 })
    }

    if (itemIds.length > 20 || itemIds.some(id => !id || id.length > 128)) {
      return NextResponse.json({ error: "Select a valid number of order items." }, { status: 400 })
    }

    const result = await prisma.$transaction(async tx => {
      // Lock the order while checking existing requests so simultaneous
      // submissions cannot create duplicate return requests for the same order.
      await tx.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "Order" WHERE "id" = ${orderId} AND "userId" = ${session.user.id} FOR UPDATE
      `
      const lockedOrder = await tx.order.findFirst({
        where: { id: orderId, userId: session.user.id },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          orderEvents: {
            where: { event: "ORDER_DELIVERED" },
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { createdAt: true },
          },
        },
      })
      if (!lockedOrder) throw new Error("RETURN_ORDER_NOT_FOUND")
      if (lockedOrder.status !== "DELIVERED") throw new Error("RETURN_ORDER_NOT_DELIVERED")
      const lockedDeliveredAt = lockedOrder.orderEvents[0]?.createdAt ?? lockedOrder.updatedAt
      if (Date.now() - lockedDeliveredAt.getTime() > 7 * 24 * 60 * 60 * 1000) {
        throw new Error("RETURN_WINDOW_CLOSED")
      }

      const existing = await tx.returnRequest.findFirst({
        where: {
          orderId,
          userId: session.user.id,
          status: { in: ["REQUESTED", "APPROVED", "PICKUP_SCHEDULED", "RECEIVED"] },
        },
        select: { id: true },
      })
      if (existing) throw new Error("RETURN_ALREADY_OPEN")

      const completed = await tx.returnRequest.findMany({
        where: {
          orderId,
          userId: session.user.id,
          status: { in: ["RECEIVED", "REFUNDED", "EXCHANGED"] },
        },
        select: { itemIds: true },
      })
      const completedItemIds = new Set(completed.flatMap(row => row.itemIds))
      if (itemIds.some(itemId => completedItemIds.has(itemId))) {
        throw new Error("RETURN_ITEM_ALREADY_RETURNED")
      }

      const created = await tx.returnRequest.create({
        data: { orderId, userId: session.user.id, reason, details: details || null, itemIds, evidence },
      })
      await tx.orderEvent.create({
        data: {
          orderId,
          actorId: session.user.id,
          event: "RETURN_REQUESTED",
          message: "Customer submitted a return request.",
          metadata: { returnRequestId: created.id, itemIds },
        },
      })
      return created
    })
    return NextResponse.json(
      { request: result, message: "Your return request has been submitted." },
      { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "RETURN_ALREADY_OPEN") {
        return NextResponse.json({ error: "A return request is already open for this order." }, { status: 409 })
      }
      if (error.message === "RETURN_ITEM_ALREADY_RETURNED") {
        return NextResponse.json({ error: "One or more selected items have already been returned or exchanged." }, { status: 409 })
      }
      if (error.message === "RETURN_ORDER_NOT_DELIVERED") {
        return NextResponse.json({ error: "Returns can only be requested for delivered orders." }, { status: 409 })
      }
      if (error.message === "RETURN_WINDOW_CLOSED") {
        return NextResponse.json({ error: "The 7-day return window for this order has ended." }, { status: 409 })
      }
      if (error.message === "RETURN_ORDER_NOT_FOUND") {
        return NextResponse.json({ error: "Order not found." }, { status: 404 })
      }
    }
    console.error("Return request creation failed:", error)
    return NextResponse.json({ error: "Unable to submit your return request." }, { status: 500 })
  }
}
