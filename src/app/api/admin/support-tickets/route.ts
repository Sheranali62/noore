import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  try {
    const tickets = await prisma.supportTicket.findMany({
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 500,
      include: {
        user: { select: { id: true, name: true, email: true } },
        order: { select: { id: true, orderNumber: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    })
    return NextResponse.json({ tickets })
  } catch (error) {
    console.error("Admin support tickets load failed:", error)
    return NextResponse.json({ error: "Unable to load support tickets." }, { status: 500 })
  }
}
