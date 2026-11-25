import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit, getClientIp } from "@/lib/rate-limit"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { calculateCouponDiscount } from "@/lib/coupons"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(`coupon-validation:${getClientIp(request)}`, 15, 60000)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds), "Cache-Control": "no-store" } }
    )
  }
  try {
    const body = await request.json().catch(() => ({}))
    const code = String(body.code || "").trim().toUpperCase()
    const rawItems = Array.isArray(body.items) ? body.items : []
    if (!code || !rawItems.length || rawItems.length > 100) {
      return NextResponse.json({ error: "Enter a coupon code and valid cart items." }, { status: 400 })
    }

    const requested = rawItems.map((item: any) => ({
      productId: String(item.productId ?? ""),
      variantId: item.variantId ? String(item.variantId) : null,
      quantity: Number(item.quantity),
    }))
    if (requested.some(item => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1)) {
      return NextResponse.json({ error: "Cart items are invalid." }, { status: 400 })
    }

    const coupon = await prisma.coupon.findUnique({ where: { code } })
    if (!coupon) return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 })

    const productIds = Array.from(new Set(requested.map(item => item.productId)))
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      include: { variants: { select: { id: true, price: true, stock: true } } },
    })
    const byId = new Map(products.map(product => [product.id, product]))
    if (products.length !== productIds.length) return NextResponse.json({ error: "One or more cart products are unavailable." }, { status: 409 })

    const couponItems = requested.map(item => {
      const product = byId.get(item.productId)!
      const variant = item.variantId ? product.variants.find(entry => entry.id === item.variantId) : null
      if (item.variantId && !variant) throw new Error("A selected product option is unavailable.")
      const stock = variant?.stock ?? product.stock
      if (item.quantity > stock) throw new Error(`Only ${stock} item(s) are available for ${product.name}.`)
      return {
        productId: product.id,
        quantity: item.quantity,
        price: variant?.price ?? product.salePrice ?? product.price,
        category: product.category,
      }
    })

    const session = await auth()
    if (session?.user?.id && coupon.perCustomer) {
      const usedByCustomer = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: session.user.id } })
      if (usedByCustomer >= coupon.perCustomer) {
        return NextResponse.json({ error: "You have already used this coupon the maximum number of times." }, { status: 400 })
      }
    }

    const result = calculateCouponDiscount(coupon, couponItems)
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 })
    }

    return NextResponse.json({
      coupon: { code: coupon.code, type: coupon.type, value: coupon.value },
      discount: result.discount,
      eligibleSubtotal: result.eligibleSubtotal,
      message: result.message,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to validate coupon."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
