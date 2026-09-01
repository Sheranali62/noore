import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderNumber = searchParams.get("orderNumber")
    const email = searchParams.get("email")

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: "Order number and email are required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: {
          select: {
            email: true,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Verify email matches (for guest orders, check against address)
    let isAuthorized = false
    
    if (order.user?.email === email) {
      isAuthorized = true
    } else {
      // Check if email matches the order address (for guest checkout)
      const address = await prisma.address.findUnique({
        where: { id: order.addressId },
      })
      if (address && address.userId === "guest") {
        // For guest orders, we store email in the address or we can check against the order
        // Since we don't store email in address, check if we have a guest user with that email
        const guestUser = await prisma.user.findUnique({
          where: { email },
        })
        if (guestUser && guestUser.id === order.userId) {
          isAuthorized = true
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error("Error tracking order:", error)
    return NextResponse.json(
      { error: "Failed to track order" },
      { status: 500 }
    )
  }
}