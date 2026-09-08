import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (guard.response) return guard.response
  const status = request.nextUrl.searchParams.get("status")
  const reviews = await prisma.productReview.findMany({ where: status === "pending" ? { approved: false } : status === "approved" ? { approved: true } : {}, orderBy: { createdAt: "desc" }, include: { product: { select: { id: true, name: true, slug: true } }, user: { select: { name: true, email: true } } } })
  return NextResponse.json(reviews)
}

export async function PATCH(request: NextRequest) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (guard.response) return guard.response
  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  const review = await prisma.productReview.update({ where: { id: body.id }, data: { ...(typeof body.approved === "boolean" ? { approved: body.approved } : {}), ...(typeof body.featured === "boolean" ? { featured: body.featured } : {}) } })
  return NextResponse.json(review)
}

export async function DELETE(request: NextRequest) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (guard.response) return guard.response
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })
  await prisma.productReview.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
