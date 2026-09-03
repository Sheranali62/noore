import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const q = params.get("q")?.trim() || ""
  const category = params.get("category")?.trim() || ""
  const gender = params.get("gender")?.trim() || ""
  const size = params.get("size")?.trim() || ""
  const color = params.get("color")?.trim() || ""
  const sale = params.get("sale") === "true"
  const inStock = params.get("inStock") === "true"
  const min = Number(params.get("min"))
  const max = Number(params.get("max"))
  const sort = params.get("sort") || "newest"
  const page = Math.max(1, Number(params.get("page") || 1))
  const take = Math.min(48, Math.max(12, Number(params.get("take") || 24)))

  const where: any = { status: "ACTIVE" }
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { subcategory: { contains: q, mode: "insensitive" } },
      { collection: { contains: q, mode: "insensitive" } },
      { tags: { has: q } },
    ]
  }
  if (category) where.category = category
  if (gender) where.gender = gender
  if (size || color) {
    where.variants = {
      some: {
        ...(size ? { size: { equals: size, mode: "insensitive" } } : {}),
        ...(color ? { color: { equals: color, mode: "insensitive" } } : {}),
        ...(inStock ? { stock: { gt: 0 } } : {}),
      },
    }
  } else if (inStock) where.stock = { gt: 0 }
  if (sale) where.salePrice = { not: null }
  if (Number.isFinite(min)) where.price = { ...(where.price || {}), gte: min }
  if (Number.isFinite(max)) where.price = { ...(where.price || {}), lte: max }

  let orderBy: any = { createdAt: "desc" }
  if (sort === "price-low") orderBy = { price: "asc" }
  if (sort === "price-high") orderBy = { price: "desc" }
  if (sort === "popular") orderBy = { orderItems: { _count: "desc" } }
  if (sort === "rating") orderBy = { reviews: { _count: "desc" } }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * take,
      take,
      select: {
        id: true, name: true, slug: true, price: true, salePrice: true,
        images: true, category: true, gender: true, stock: true,
        variants: { select: { color: true, size: true, stock: true } },
        _count: { select: { reviews: true, orderItems: true } },
      },
    }),
  ])

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / take) })
}
