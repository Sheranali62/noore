import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const orderNumber = request.nextUrl.searchParams
      .get("orderNumber")
      ?.trim()

    const email = request.nextUrl.searchParams
      .get("email")
      ?.trim()
      .toLowerCase()

    if (!orderNumber || !email) {
      return NextResponse.json(
        { error: "Order number and email are required" },
        { status: 400 }
      )
    }

    const order = await prisma.order.findUnique({
      where: {
        orderNumber,
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
        address: true,
        items: {
          include: {
            product: true,
            variant: true,
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

    if (order.user?.email?.toLowerCase() !== email) {
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