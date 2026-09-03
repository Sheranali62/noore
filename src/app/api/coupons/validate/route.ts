import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateCouponDiscount } from "@/lib/coupons"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = String(body.code ?? "").trim().toUpperCase()
    const items = Array.isArray(body.items) ? body.items : []
    if (!code || !items.length) return NextResponse.json({ error: "Coupon code and cart items are required" }, { status: 400 })

    const requested = items.map((item: any) => ({ productId: String(item.productId ?? ""), variantId: item.variantId ? String(item.variantId) : null, quantity: Number(item.quantity) }))
    if (requested.some((item: any) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) return NextResponse.json({ error: "Invalid cart items" }, { status: 400 })

    const coupon = await prisma.coupon.findUnique({ where: { code } })
    if (!coupon) return NextResponse.json({ error: "Invalid coupon code" }, { status: 404 })

    const ids: string[] = Array.from(new Set(requested.map((item: any) => item.productId)))
    const products = await prisma.product.findMany({ where: { id: { in: ids } }, include: { variants: true } })
    const byId = new Map(products.map(product => [product.id, product]))
    if (products.length !== ids.length) return NextResponse.json({ error: "One or more cart products are unavailable" }, { status: 400 })

    const cartItems = requested.map((item: any) => {
      const product = byId.get(item.productId)!
      const variant = item.variantId ? product.variants.find(v => v.id === item.variantId) : null
      if (item.variantId && !variant) throw new Error(`Invalid variant for ${product.name}`)
      return { productId: product.id, quantity: item.quantity, price: variant?.price ?? product.salePrice ?? product.price, category: product.category }
    })

    const result = calculateCouponDiscount(coupon, cartItems)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to validate coupon"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
