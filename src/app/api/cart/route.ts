import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Sign in to sync your cart." }, { status: 401 })

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true, stock: true, status: true } },
          variant: { select: { id: true, color: true, size: true, price: true, images: true, stock: true } },
        },
      },
    },
  })

  const items = (cart?.items ?? []).flatMap((item) => {
    if (item.product.status !== "ACTIVE") return []
    const price = item.variant?.price ?? item.product.salePrice ?? item.product.price
    return [{
      id: item.variantId ?? item.productId,
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      name: item.product.name,
      slug: item.product.slug,
      price,
      image: item.variant?.images?.[0] || item.product.images?.[0] || "",
      quantity: item.quantity,
      variantLabel: item.variant ? [item.variant.color, item.variant.size].filter(Boolean).join(" / ") : undefined,
      stock: item.variant?.stock ?? item.product.stock,
    }]
  })
  return NextResponse.json({ items })
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: "Sign in to sync your cart." }, { status: 401 })

  try {
    const body = await request.json().catch(() => ({}))
    const rawItems = Array.isArray(body.items) ? body.items : []
    if (rawItems.length > 100) return NextResponse.json({ error: "Your cart contains too many items." }, { status: 400 })

    const requested = rawItems.map((item: any) => ({
      productId: String(item.productId ?? ""),
      variantId: item.variantId ? String(item.variantId) : null,
      quantity: Number(item.quantity),
    }))
    if (requested.some((item: any) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99)) {
      return NextResponse.json({ error: "Cart item details are invalid." }, { status: 400 })
    }

    const productIds = Array.from(new Set(requested.map((item: any) => item.productId)))
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, status: "ACTIVE" },
      include: { variants: { select: { id: true, stock: true } } },
    })
    const byId = new Map(products.map((product) => [product.id, product]))
    if (products.length !== productIds.length) return NextResponse.json({ error: "One or more products are no longer available." }, { status: 409 })

    for (const item of requested) {
      const product = byId.get(item.productId)!
      const variant = item.variantId ? product.variants.find((entry) => entry.id === item.variantId) : null
      if (item.variantId && !variant) return NextResponse.json({ error: "A selected product option is no longer available." }, { status: 409 })
      const stock = variant?.stock ?? product.stock
      if (item.quantity > stock) return NextResponse.json({ error: `Only ${stock} item(s) are currently available.` }, { status: 409 })
    }

    await prisma.$transaction(async (tx) => {
      const cart = await tx.cart.upsert({
        where: { userId },
        create: { userId },
        update: {},
        select: { id: true },
      })
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })
      if (requested.length) {
        await tx.cartItem.createMany({
          data: requested.map((item: any) => ({
            cartId: cart.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        })
      }

      await tx.cart.update({
        where: { id: cart.id },
        data: { updatedAt: new Date(), abandonedReminderAt: null },
      })
    })

    return NextResponse.json({ success: true, itemCount: requested.length })
  } catch (error) {
    console.error("Cart sync failed:", error)
    return NextResponse.json({ error: "Unable to save your cart right now." }, { status: 500 })
  }
}
