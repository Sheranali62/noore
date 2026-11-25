import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase()
}

function trackingResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
    },
  })
}

export async function GET(request: NextRequest) {
  const rateLimit = await enforceRateLimit(request, "order-tracking", 20, 60000)
  if (rateLimit) return rateLimit

  try {
    const orderNumber = request.nextUrl.searchParams.get("orderNumber")?.trim()
    const email = normalizeEmail(request.nextUrl.searchParams.get("email"))

    if (
      !orderNumber ||
      orderNumber.length > 64 ||
      !email ||
      email.length > 254 ||
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)
    ) {
      return trackingResponse({ error: "A valid order number and email are required" }, 400)
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      select: {
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        paymentMethod: true,
        trackingNumber: true,
        courier: true,
        user: { select: { email: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            price: true,
            total: true,
            product: { select: { name: true, images: true } },
            variant: { select: { color: true, size: true } },
          },
        },
      },
    })

    if (!order || normalizeEmail(order.user?.email) !== email) {
      return trackingResponse({ error: "Order not found or verification failed" }, 404)
    }

    return trackingResponse({ order })
  } catch (error) {
    console.error("Error tracking order:", error)
    return trackingResponse({ error: "Failed to track order" }, 500)
  }
}
