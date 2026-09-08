import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId")
  if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 })
  const reviews = await prisma.productReview.findMany({ where: { productId, approved: true }, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], include: { user: { select: { name: true } } } })
  const summary = reviews.reduce((a, r) => ({ count: a.count + 1, total: a.total + r.rating }), { count: 0, total: 0 })
  return NextResponse.json({ reviews, average: summary.count ? Number((summary.total / summary.count).toFixed(1)) : 0, count: summary.count })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 })
  const body = await request.json()
  const productId = String(body.productId || "")
  const rating = Number(body.rating)
  const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1500) : ""
  if (!productId || !Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Product and rating 1-5 are required" }, { status: 400 })
  const purchased = await prisma.orderItem.findFirst({ where: { productId, order: { userId: session.user.id, status: "DELIVERED" } } })
  if (!purchased) return NextResponse.json({ error: "Reviews are available after a delivered purchase." }, { status: 403 })
  const existing = await prisma.productReview.findFirst({ where: { productId, userId: session.user.id } })
  if (existing) return NextResponse.json({ error: "You have already reviewed this product." }, { status: 409 })
  const review = await prisma.productReview.create({ data: { productId, userId: session.user.id, rating, comment: comment || null, verified: true, approved: false } })
  return NextResponse.json({ review, message: "Thank you. Your review is awaiting approval." }, { status: 201 })
}
