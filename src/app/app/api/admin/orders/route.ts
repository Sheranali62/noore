import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const { response } = await requireAdmin([
    "SUPER_ADMIN",
    "ADMIN",
    "ORDER_MANAGER",
  ])

  if (response) return response

  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        status: true,
        paymentMethod: true,
        paymentStatus: true,
        trackingNumber: true,
        courier: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Admin orders list failed:", error)
    return NextResponse.json(
      { error: "Unable to load orders right now", orders: [] },
      { status: 500 }
    )
  }
}
