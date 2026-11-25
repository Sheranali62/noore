import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  const transactions = await prisma.paymentTransaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { order: { select: { orderNumber: true, total: true, paymentMethod: true, paymentStatus: true, user: { select: { email: true, name: true } } } } },
  })
  return NextResponse.json({ transactions })
}
