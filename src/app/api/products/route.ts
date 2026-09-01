import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all products
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error("Error fetching products:", error)
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    )
  }
}

// POST new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.slug || !body.sku || !body.category || !body.price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug: body.slug,
        sku: body.sku,
        description: body.description || "",
        category: body.category,
        subcategory: body.subcategory || "",
        price: body.price,
        salePrice: body.salePrice || null,
        stock: body.stock || 0,
        status: body.status || "DRAFT",
        images: body.images || [],
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error("Error creating product:", error)
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    )
  }
}