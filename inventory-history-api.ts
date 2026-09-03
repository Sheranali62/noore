import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
export const dynamic = "force-dynamic"
export async function GET(request: NextRequest) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER", "ORDER_MANAGER"])
  if (response) return response
  try {
    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 50), 1), 200)
    const movements = await (prisma as any).inventoryMovement.findMany({ take: limit, orderBy: { createdAt: "desc" }, include: { product: { select: { name: true, sku: true } }, variant: { select: { color: true, size: true, sku: true } } } })
    return NextResponse.json({ movements })
  } catch (error) { console.error("Inventory history error:", error); return NextResponse.json({ error: "Failed to load inventory history" }, { status: 500 }) }
}
