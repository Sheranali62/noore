import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function GET() {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } })
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

    if (!name || !slug || !sku || !category || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Invalid product fields" }, { status: 400 })
    }
    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) {
      return NextResponse.json({ error: "Sale price must be between 0 and the regular price" }, { status: 400 })
    }

    const duplicate = await prisma.product.findFirst({ where: { OR: [{ slug }, { sku }] }, select: { id: true } })
    if (duplicate) return NextResponse.json({ error: "Slug or SKU already exists" }, { status: 409 })

    const product = await prisma.product.create({
      data: {
        name, slug, sku, category,
        description: String(body.description ?? "").trim(),
        subcategory: String(body.subcategory ?? "").trim() || null,
        price, salePrice, stock,
        status: body.status || "DRAFT",
        images: Array.isArray(body.images) ? body.images.filter((v: unknown): v is string => typeof v === "string" && v.trim() !== "") : [],
      },
    })
    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}
