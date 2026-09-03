import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({ where: { id: params.id } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })
    return NextResponse.json(product)
  } catch (error) {
    console.error("Error fetching product:", error)
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"])
  if (response) return response

  try {
    const body = await request.json()
    const name = String(body.name ?? "").trim()
    const slug = String(body.slug ?? "").trim().toLowerCase()
    const sku = String(body.sku ?? "").trim().toUpperCase()
    const category = String(body.category ?? "").trim()
    const price = Number(body.price)
    const stock = Number(body.stock)
    const salePrice = body.salePrice === null || body.salePrice === "" || body.salePrice === undefined ? null : Number(body.salePrice)
    if (!name || !slug || !sku || !category || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) {
      return NextResponse.json({ error: "Invalid product fields" }, { status: 400 })
    }
    if (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0 || salePrice > price)) {
      return NextResponse.json({ error: "Sale price must be between 0 and the regular price" }, { status: 400 })
    }

    const duplicate = await prisma.product.findFirst({ where: { OR: [{ slug }, { sku }], NOT: { id: params.id } }, select: { id: true } })
    if (duplicate) return NextResponse.json({ error: "Slug or SKU already exists" }, { status: 409 })

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name, slug, sku, category,
        description: String(body.description ?? "").trim(),
        subcategory: String(body.subcategory ?? "").trim() || null,
        price, salePrice, stock,
        status: body.status || "DRAFT",
        images: Array.isArray(body.images) ? body.images.filter((v: unknown): v is string => typeof v === "string" && v.trim() !== "") : [],
      },
    })
    return NextResponse.json(product)
  } catch (error) {
    console.error("Error updating product:", error)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"])
  if (response) return response

  try {
    const product = await prisma.product.findUnique({ where: { id: params.id }, select: { id: true, orderItems: { select: { id: true }, take: 1 } } })
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 })

    if (product.orderItems.length > 0) {
      await prisma.product.update({ where: { id: params.id }, data: { status: "ARCHIVED" } })
      return NextResponse.json({ message: "Product archived because it is referenced by an order" })
    }

    await prisma.product.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Product deleted successfully" })
  } catch (error) {
    console.error("Error deleting product:", error)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}
