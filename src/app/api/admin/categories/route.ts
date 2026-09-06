import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"])
  if (response) return response
  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { parent: { select: { id: true, name: true } }, _count: { select: { children: true } } } })
  return NextResponse.json(categories)
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"])
  if (response) return response
  try {
    const body = await request.json()
    const name = String(body.name ?? "").trim()
    const slug = String(body.slug ?? name).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const parentId = body.parentId ? String(body.parentId) : null
    if (!name || !slug) return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    if (parentId) {
      const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { id: true } })
      if (!parent) return NextResponse.json({ error: "Parent category not found" }, { status: 400 })
    }
    const duplicate = await prisma.category.findUnique({ where: { slug }, select: { id: true } })
    if (duplicate) return NextResponse.json({ error: "A category with this name/slug already exists" }, { status: 409 })
    const category = await prisma.category.create({ data: { name, slug, parentId, description: String(body.description ?? "").trim() || null, active: body.active !== false, sortOrder: Number.isInteger(body.sortOrder) ? body.sortOrder : 0 } })
    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error("Create category error:", error)
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 })
  }
}
