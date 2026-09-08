import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId") || undefined
  const exclude = new Set((searchParams.get("exclude") || "").split(",").filter(Boolean))
  if (productId) exclude.add(productId)

  const source = productId ? await prisma.product.findUnique({ where: { id: productId }, select: { category: true, subcategory: true, collection: true, gender: true, fabric: true, tags: true } }) : null
  const session = await getServerSession(authOptions)
  let preferredIds: string[] = []
  if (session?.user?.id) {
    const [wishlist, orders] = await Promise.all([
      prisma.wishlist.findUnique({ where: { userId: session.user.id }, include: { items: { select: { productId: true } } } }),
      prisma.order.findMany({ where: { userId: session.user.id }, select: { items: { select: { productId: true } } }, orderBy: { createdAt: "desc" }, take: 12 }),
    ])
    preferredIds = [...(wishlist?.items.map(i => i.productId) || []), ...orders.flatMap(o => o.items.map(i => i.productId))]
  }

  let preferredCategories: string[] = []
  if (!source && preferredIds.length) {
    const preferred = await prisma.product.findMany({ where: { id: { in: preferredIds } }, select: { category: true, collection: true, gender: true, fabric: true } })
    preferredCategories = [...new Set(preferred.map(p => p.category).filter(Boolean))]
  }
  const where: any = { status: "ACTIVE", id: { notIn: [...exclude] } }
  if (source) {
    where.OR = [
      { category: source.category },
      ...(source.subcategory ? [{ subcategory: source.subcategory }] : []),
      ...(source.collection ? [{ collection: source.collection }] : []),
      ...(source.gender ? [{ gender: source.gender }] : []),
      ...(source.fabric ? [{ fabric: source.fabric }] : []),
      ...(source.tags.length ? [{ tags: { hasSome: source.tags.slice(0, 5) } }] : []),
    ]
  } else if (preferredCategories.length) {
    where.OR = preferredCategories.map(category => ({ category }))
  }
  let products = await prisma.product.findMany({ where, take: 8, orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true, category: true, stock: true, lowStock: true } })
  if (products.length < 4) {
    products = await prisma.product.findMany({ where: { status: "ACTIVE", id: { notIn: [...exclude] } }, take: 8, orderBy: { createdAt: "desc" }, select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true, category: true, stock: true, lowStock: true } })
  }
  return NextResponse.json({ products })
}
