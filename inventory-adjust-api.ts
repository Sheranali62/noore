import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"])
  if (response) return response

  try {
    const body = await request.json()
    const productId = String(body.productId || "")
    const variantId = body.variantId ? String(body.variantId) : null
    const change = Number(body.change)
    const reason = String(body.reason || "Adjustment").trim().slice(0, 100)
    const note = body.note ? String(body.note).trim().slice(0, 500) : null

    if (!productId || !Number.isInteger(change) || change === 0) {
      return NextResponse.json({ error: "Product and a non-zero whole-number stock change are required." }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({ where: { id: productId }, include: { variants: true } })
      if (!product) throw new Error("Product not found")

      if (variantId) {
        const variant = product.variants.find((v) => v.id === variantId)
        if (!variant) throw new Error("Variant not found")
        const afterStock = variant.stock + change
        if (afterStock < 0) throw new Error("Stock cannot be negative")
        await tx.productVariant.update({ where: { id: variantId }, data: { stock: afterStock } })
        await (tx as any).inventoryMovement.create({ data: { productId, variantId, change, beforeStock: variant.stock, afterStock, reason, note } })
        return { productId, variantId, beforeStock: variant.stock, afterStock }
      }

      const afterStock = product.stock + change
      if (afterStock < 0) throw new Error("Stock cannot be negative")
      await tx.product.update({ where: { id: productId }, data: { stock: afterStock } })
      await (tx as any).inventoryMovement.create({ data: { productId, change, beforeStock: product.stock, afterStock, reason, note } })
      return { productId, variantId: null, beforeStock: product.stock, afterStock }
    })

    return NextResponse.json({ success: true, ...result, changedBy: session?.user?.email || "admin" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to adjust inventory"
    const status = /not found|cannot be negative|required/i.test(message) ? 400 : 500
    console.error("Inventory adjustment error:", error)
    return NextResponse.json({ error: message }, { status })
  }
}
