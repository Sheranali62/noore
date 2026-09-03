import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const SIZE_WORDS = ["xs", "s", "m", "l", "xl", "xxl", "2xl", "3xl", "4xl", "small", "medium", "large"]
const COLORS = ["black", "white", "ivory", "cream", "beige", "brown", "blue", "navy", "green", "olive", "pink", "red", "maroon", "purple", "grey", "gray", "gold", "silver", "mustard", "peach", "teal"]
const FILTER_WORDS = new Set(["sale", "selling", "under", "below", "less", "than", "over", "above", "between", "rs", "pkr", "price", "in", "stock", "available", "for", "men", "women", ...SIZE_WORDS, ...COLORS])

function parseSmartQuery(input: string) {
  const raw = input.toLowerCase().replace(/,/g, " ").replace(/\s+/g, " ").trim()
  const tokens = raw.split(" ").filter(Boolean)
  const detected: { color?: string; size?: string; gender?: string; sale?: boolean; inStock?: boolean; min?: number; max?: number } = {}

  const color = tokens.find((token) => COLORS.includes(token))
  if (color) detected.color = color
  const size = tokens.find((token) => SIZE_WORDS.includes(token))
  if (size) detected.size = size
  if (tokens.includes("men") || tokens.includes("mens") || tokens.includes("male")) detected.gender = "Men"
  if (tokens.includes("women") || tokens.includes("womens") || tokens.includes("female")) detected.gender = "Women"
  if (tokens.includes("sale") || tokens.includes("discount") || tokens.includes("discounted")) detected.sale = true
  if (tokens.includes("stock") || tokens.includes("available")) detected.inStock = true

  const under = raw.match(/(?:under|below|less than)\s*(?:pkr|rs)?\s*([\d,]+)/)
  const over = raw.match(/(?:over|above|more than)\s*(?:pkr|rs)?\s*([\d,]+)/)
  const between = raw.match(/between\s*(?:pkr|rs)?\s*([\d,]+)\s*(?:and|-)\s*(?:pkr|rs)?\s*([\d,]+)/)
  if (between) {
    detected.min = Number(between[1].replace(/,/g, ""))
    detected.max = Number(between[2].replace(/,/g, ""))
  } else if (under) detected.max = Number(under[1].replace(/,/g, ""))
  else if (over) detected.min = Number(over[1].replace(/,/g, ""))

  const textTokens = tokens.filter((token) => !FILTER_WORDS.has(token) && !/^\d[\d,]*$/.test(token))
  return { detected, textTokens }
}

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

  const smart = parseSmartQuery(q)
  const effectiveGender = gender || smart.detected.gender || ""
  const effectiveSize = size || smart.detected.size || ""
  const effectiveColor = color || smart.detected.color || ""
  const effectiveSale = sale || !!smart.detected.sale
  const effectiveStock = inStock || !!smart.detected.inStock
  const effectiveMin = Number.isFinite(min) ? min : smart.detected.min
  const effectiveMax = Number.isFinite(max) ? max : smart.detected.max

  const where: any = { status: "ACTIVE" }
  if (smart.textTokens.length) {
    where.AND = smart.textTokens.map((token) => ({
      OR: [
        { name: { contains: token, mode: "insensitive" } },
        { sku: { contains: token, mode: "insensitive" } },
        { category: { contains: token, mode: "insensitive" } },
        { subcategory: { contains: token, mode: "insensitive" } },
        { collection: { contains: token, mode: "insensitive" } },
        { fabric: { contains: token, mode: "insensitive" } },
        { type: { contains: token, mode: "insensitive" } },
        { tags: { has: token } },
      ],
    }))
  }
  if (category) where.category = category
  if (effectiveGender) where.gender = { equals: effectiveGender, mode: "insensitive" }
  if (effectiveSize || effectiveColor) {
    where.variants = {
      some: {
        ...(effectiveSize ? { size: { equals: effectiveSize, mode: "insensitive" } } : {}),
        ...(effectiveColor ? { color: { equals: effectiveColor, mode: "insensitive" } } : {}),
        ...(effectiveStock ? { stock: { gt: 0 } } : {}),
      },
    }
  } else if (effectiveStock) where.stock = { gt: 0 }
  if (effectiveSale) where.salePrice = { not: null }
  if (Number.isFinite(effectiveMin) || Number.isFinite(effectiveMax)) {
    where.price = {}
    if (Number.isFinite(effectiveMin)) where.price.gte = effectiveMin
    if (Number.isFinite(effectiveMax)) where.price.lte = effectiveMax
  }

  let orderBy: any = { createdAt: "desc" }
  if (sort === "price-low") orderBy = { price: "asc" }
  if (sort === "price-high") orderBy = { price: "desc" }
  if (sort === "popular") orderBy = { orderItems: { _count: "desc" } }
  if (sort === "rating") orderBy = { reviews: { _count: "desc" } }

  const [total, products, categories, genders, collections] = await Promise.all([
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
    prisma.product.findMany({ where: { status: "ACTIVE" }, select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", gender: { not: null } }, select: { gender: true }, distinct: ["gender"], orderBy: { gender: "asc" } }),
    prisma.product.findMany({ where: { status: "ACTIVE", collection: { not: null } }, select: { collection: true }, distinct: ["collection"], orderBy: { collection: "asc" } }),
  ])

  const facetValues = {
    categories: categories.map((x) => x.category),
    genders: genders.flatMap((x) => x.gender ? [x.gender] : []),
    collections: collections.flatMap((x) => x.collection ? [x.collection] : []),
    colors: Array.from(new Set(products.flatMap((p) => p.variants.map((v) => v.color)))).slice(0, 30),
    sizes: Array.from(new Set(products.flatMap((p) => p.variants.map((v) => v.size)))).slice(0, 20),
  }

  return NextResponse.json({ products, total, page, pages: Math.ceil(total / take), detectedFilters: smart.detected, facets: facetValues })
}
