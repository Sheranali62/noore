import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { enforceRateLimit } from "@/lib/rate-limit"

export const dynamic = "force-dynamic"

function isCrossSite(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (request.headers.get("sec-fetch-site") === "cross-site") return true
  if (!origin) return false
  try {
    return new URL(origin).origin !== request.nextUrl.origin
  } catch {
    return true
  }
}

async function readProductId(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? ""
  if (!contentType.toLowerCase().includes("application/json")) {
    return { error: "A JSON request body is required.", status: 415 as const }
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > 4 * 1024) return { error: "Wishlist request is too large.", status: 413 as const }
  const body = await request.json().catch(() => null)
  const productId = typeof body?.productId === "string" ? body.productId.trim() : ""
  if (!productId || productId.length > 128) return { error: "A valid product ID is required.", status: 400 as const }
  return { productId }
}

const publicProductSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  salePrice: true,
  images: true,
  status: true,
  stock: true,
  category: true,
  gender: true,
  collection: true,
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: { product: { select: publicProductSelect } },
        },
      },
    })

    return NextResponse.json(
      { items: wishlist?.items.filter(item => item.product.status === "ACTIVE") ?? [] },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    console.error("Error fetching wishlist:", error)
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (isCrossSite(request)) return NextResponse.json({ error: "Cross-site wishlist updates are not allowed." }, { status: 403 })
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rateLimit = await enforceRateLimit(request, "wishlist-change", 60, 60 * 60 * 1000, session.user.id)
  if (rateLimit) return rateLimit

  try {
    const parsed = await readProductId(request)
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })

    const product = await prisma.product.findUnique({
      where: { id: parsed.productId },
      select: { id: true, status: true },
    })
    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json({ error: "Product not found or no longer available." }, { status: 404 })
    }

    const wishlist = await prisma.wishlist.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
      select: { id: true },
    })
    const existing = await prisma.wishlistItem.findFirst({
      where: { wishlistId: wishlist.id, productId: product.id },
      select: { id: true },
    })
    if (existing) return NextResponse.json({ error: "Product already in wishlist" }, { status: 409 })

    const item = await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId: product.id },
      include: { product: { select: publicProductSelect } },
    })
    return NextResponse.json(
      { success: true, item },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "Product already in wishlist" }, { status: 409 })
    }
    console.error("Error adding to wishlist:", error)
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (isCrossSite(request)) return NextResponse.json({ error: "Cross-site wishlist updates are not allowed." }, { status: 403 })
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const rateLimit = await enforceRateLimit(request, "wishlist-change", 60, 60 * 60 * 1000, session.user.id)
  if (rateLimit) return rateLimit

  try {
    const parsed = await readProductId(request)
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: parsed.status })
    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!wishlist) return NextResponse.json({ error: "Wishlist not found" }, { status: 404 })

    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId: parsed.productId },
    })
    return NextResponse.json(
      { success: true, message: "Removed from wishlist" },
      { headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    console.error("Error removing from wishlist:", error)
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 })
  }
}
