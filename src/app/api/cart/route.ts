import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 })

  try {
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true, status: true } },
            variant: { select: { id: true, color: true, size: true, price: true, stock: true, images: true } },
          },
        },
      },
    })

    const items = (cart?.items ?? []).map(item => ({
      id: `${item.productId}:${item.variantId ?? "default"}`,
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      name: item.product.name,
      slug: item.product.slug,
      quantity: item.quantity,
      price: item.variant?.price ?? item.product.salePrice ?? item.product.price,
      image: item.variant?.images?.[0] || item.product.images?.[0] || "",
      variantLabel: item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(" / ") : undefined,
    }))

    return NextResponse.json({ items }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Load customer cart failed:", error)
    return NextResponse.json({ error: "Unable to load your saved cart." }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Login required" }, { status: 401 })

  try {
    const body = await request.json()
    if (!Array.isArray(body.items) || body.items.length > 50) {
      return NextResponse.json({ error: "Invalid cart contents." }, { status: 400 })
    }

    const merged = new Map<string, { productId: string; variantId: string | null; quantity: number }>()
    for (const raw of body.items) {
      const productId = String(raw.productId ?? "").trim()
      const variantId = raw.variantId ? String(raw.variantId) : null
      const quantity = Number(raw.quantity)
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return NextResponse.json({ error: "Cart item details are invalid." }, { status: 400 })
      }
      const key = `${productId}:${variantId ?? "default"}`
      const previous = merged.get(key)
      merged.set(key, { productId, variantId, quantity: Math.min(20, (previous?.quantity ?? 0) + quantity) })
    }

    const items = Array.from(merged.values())
    const products = items.length
      ? await prisma.product.findMany({ where: { id: { in: [...new Set(items.map(item => item.productId))] }, status: "ACTIVE" }, include: { variants: true } })
      : []
    const productMap = new Map(products.map(product => [product.id, product]))
    if (products.length !== new Set(items.map(item => item.productId)).size) {
      return NextResponse.json({ error: "A product in your cart is no longer available." }, { status: 409 })
    }

    for (const item of items) {
      const product = productMap.get(item.productId)!
      const variant = item.variantId ? product.variants.find(entry => entry.id === item.variantId) : null
      if (item.variantId && !variant) return NextResponse.json({ error: `A selected option for ${product.name} is no longer available.` }, { status: 409 })
      const stock = variant?.stock ?? product.stock
      if (item.quantity > stock) return NextResponse.json({ error: `Only ${stock} unit(s) of ${product.name} are available.` }, { status: 409 })
    }

    await prisma.$transaction(async tx => {
      const cart = await tx.cart.upsert({
        where: { userId },
        update: {},
        create: { userId },
        select: { id: true },
      })
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      if (items.length) {
        await tx.cartItem.createMany({
          data: items.map(item => ({ cartId: cart.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
        })
      }
    })

    return NextResponse.json({ success: true, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) })
  } catch (error) {
    console.error("Save customer cart failed:", error)
    return NextResponse.json({ error: "Unable to save your cart right now." }, { status: 500 })
  }
}
