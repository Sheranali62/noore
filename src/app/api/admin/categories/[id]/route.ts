import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"])
  if (response) return response
  try {
    const body = await request.json()
    const current = await prisma.category.findUnique({ where: { id: params.id } })
    if (!current) return NextResponse.json({ error: "Category not found" }, { status: 404 })
    const name = String(body.name ?? current.name).trim()
    const slug = String(body.slug ?? current.slug).trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const parentId = body.parentId === null || body.parentId === "" ? null : String(body.parentId ?? current.parentId ?? "") || null
    if (!name || !slug) return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    if (parentId === params.id) return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 })
    const duplicate = await prisma.category.findFirst({ where: { slug, NOT: { id: params.id } }, select: { id: true } })
    if (duplicate) return NextResponse.json({ error: "A category with this name/slug already exists" }, { status: 409 })
    const category = await prisma.category.update({ where: { id: params.id }, data: { name, slug, parentId, description: body.description === undefined ? current.description : String(body.description ?? "").trim() || null, active: body.active === undefined ? current.active : Boolean(body.active), sortOrder: body.sortOrder === undefined ? current.sortOrder : Number(body.sortOrder) } })
    return NextResponse.json(category)
  } catch (error) {
    console.error("Update category error:", error)
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "PRODUCT_MANAGER"])
  if (response) return response
  try {
    const childCount = await prisma.category.count({ where: { parentId: params.id } })
    if (childCount) return NextResponse.json({ error: "Move or delete child sub-categories first" }, { status: 409 })
    await prisma.category.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Category deleted" })
  } catch (error) {
    console.error("Delete category error:", error)
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 })
  }
}
