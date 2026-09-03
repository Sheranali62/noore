import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({ where: { id: params.id }, include: { variants: true } })
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

    const rawVariants = Array.isArray(body.variants) ? body.variants : []
    const variants = rawVariants.map((variant: any) => ({
      id: variant.id ? String(variant.id) : undefined,
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
    const existing = await prisma.productVariant.findMany({ where: { productId: params.id }, select: { id: true } })
    const existingIds = new Set(existing.map(v => v.id))
    if (variants.some((v: any) => v.id && !existingIds.has(v.id))) {
      return NextResponse.json({ error: "Invalid product variant" }, { status: 400 })
    }
    const variantStock = variants.length ? variants.reduce((sum: number, v: any) => sum + v.stock, 0) : stock
    const incomingIds = new Set(variants.filter((v: any) => v.id).map((v: any) => v.id))

    const product = await prisma.$transaction(async (tx) => {
      // Variants that are removed from the editor are kept for historical order integrity,
      // but their stock is set to zero so they cannot be purchased.
      for (const existingVariant of existing) {
        if (!incomingIds.has(existingVariant.id)) {
          await tx.productVariant.update({ where: { id: existingVariant.id }, data: { stock: 0 } })
        }
      }
      for (const variant of variants) {
        if (variant.id) {
          await tx.productVariant.update({ where: { id: variant.id }, data: { color: variant.color, size: variant.size, sku: variant.sku, price: variant.price, stock: variant.stock, images: variant.images } })
        } else {
          await tx.productVariant.create({ data: { productId: params.id, color: variant.color, size: variant.size, sku: variant.sku, price: variant.price, stock: variant.stock, images: variant.images } })
        }
      }
      return tx.product.update({
        where: { id: params.id },
        data: {
          name, slug, sku, category,
          description: String(body.description ?? "").trim(),
          subcategory: String(body.subcategory ?? "").trim() || null,
          price, salePrice, stock: variantStock,
          status: body.status || "DRAFT",
          images: Array.isArray(body.images) ? body.images.filter((v: unknown): v is string => typeof v === "string" && v.trim() !== "") : [],
        },
        include: { variants: true },
      })
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
