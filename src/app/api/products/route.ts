import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"])
  if (response) return response

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { variants: true },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"])
  if (response) return response

  try {
    const body = await request.json()
    const name = String(body.name ?? "").trim()
    const slug = String(body.slug ?? "").trim().toLowerCase()
    const sku = String(body.sku ?? "").trim().toUpperCase()
    const category = String(body.category ?? "").trim()
    const price = Number(body.price)
    const stock = Number(body.stock ?? 0)
    const salePrice = body.salePrice === null || body.salePrice === "" || body.salePrice === undefined ? null : Number(body.salePrice)
    const costPrice = body.costPrice === null || body.costPrice === "" || body.costPrice === undefined ? null : Number(body.costPrice)
    const pieces = body.pieces === null || body.pieces === "" || body.pieces === undefined ? null : Number(body.pieces)
    const lowStock = body.lowStock === null || body.lowStock === "" || body.lowStock === undefined ? 5 : Number(body.lowStock)

    if (!name || !slug || !sku || !category || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Invalid product fields" }, { status: 400 })
    }
    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) {
      return NextResponse.json({ error: "Sale price must be between 0 and the regular price" }, { status: 400 })
    }
    if (costPrice !== null && (!Number.isFinite(costPrice) || costPrice < 0)) {
      return NextResponse.json({ error: "Cost price must be a valid positive amount" }, { status: 400 })
    }
    if (pieces !== null && (!Number.isInteger(pieces) || pieces < 1)) {
      return NextResponse.json({ error: "Pieces must be a whole number greater than zero" }, { status: 400 })
    }
    if (!Number.isInteger(lowStock) || lowStock < 0) {
      return NextResponse.json({ error: "Low-stock threshold must be a whole number" }, { status: 400 })
    }

    const duplicate = await prisma.product.findFirst({ where: { OR: [{ slug }, { sku }] }, select: { id: true } })
    if (duplicate) return NextResponse.json({ error: "Slug or SKU already exists" }, { status: 409 })

    const rawVariants = Array.isArray(body.variants) ? body.variants : []
    const variants = rawVariants.map((variant: any) => ({
      color: String(variant.color ?? "").trim(),
      size: String(variant.size ?? "").trim(),
      sku: String(variant.sku ?? "").trim().toUpperCase(),
      price: variant.price === null || variant.price === "" || variant.price === undefined ? null : Number(variant.price),
      stock: Number(variant.stock ?? 0),
      images: Array.isArray(variant.images) ? variant.images.filter((v: unknown): v is string => typeof v === "string" && v.trim() !== "") : [],
    }))

    if (variants.some((v: any) => !v.color || !v.size || !v.sku || !Number.isInteger(v.stock) || v.stock < 0 || (v.price !== null && (!Number.isFinite(v.price) || v.price < 0)))) {
      return NextResponse.json({ error: "Each variant needs color, size, SKU and valid stock/price" }, { status: 400 })
    }
    if (new Set(variants.map((v: any) => v.sku)).size !== variants.length) {
      return NextResponse.json({ error: "Variant SKUs must be unique" }, { status: 400 })
    }

    const variantStock = variants.length ? variants.reduce((sum: number, v: any) => sum + v.stock, 0) : stock
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        sku,
        category,
        description: String(body.description ?? "").trim() || null,
        subcategory: String(body.subcategory ?? "").trim() || null,
        collection: String(body.collection ?? "").trim() || null,
        gender: String(body.gender ?? "").trim() || null,
        type: String(body.type ?? "").trim() || null,
        fabric: String(body.fabric ?? "").trim() || null,
        pieces,
        costPrice,
        lowStock,
        video: String(body.video ?? "").trim() || null,
        tags: Array.isArray(body.tags) ? body.tags.filter((v: unknown): v is string => typeof v === "string" && v.trim() !== "").map((v: string) => v.trim()) : [],
        seoTitle: String(body.seoTitle ?? "").trim() || null,
        seoDesc: String(body.seoDesc ?? "").trim() || null,
        price,
        salePrice,
        stock: variantStock,
        status: body.status || "DRAFT",
        images: Array.isArray(body.images) ? body.images.filter((v: unknown): v is string => typeof v === "string" && v.trim() !== "") : [],
        variants: variants.length ? { create: variants } : undefined,
      },
      include: { variants: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
