import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN"])
  if (response) return response
  try {
    const coupon = await prisma.coupon.findUnique({ where: { id: params.id } })
    if (!coupon) return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json({ error: "Failed to fetch coupon" }, { status: 500 })
  }
}

function parseCoupon(body: any) {
  const code = String(body.code ?? "").trim().toUpperCase()
  const type = String(body.type ?? "")
  const value = Number(body.value)
  const minOrder = Number(body.minOrder ?? 0)
  const maxDiscount = body.maxDiscount == null || body.maxDiscount === "" ? null : Number(body.maxDiscount)
  const usageLimit = body.usageLimit == null || body.usageLimit === "" ? null : Number(body.usageLimit)
  const perCustomer = body.perCustomer == null || body.perCustomer === "" ? null : Number(body.perCustomer)
  const startDate = new Date(body.startDate)
  const expiryDate = new Date(body.expiryDate)
  if (!/^[A-Z0-9_-]{3,50}$/.test(code)) throw new Error("Coupon code must be 3-50 characters using letters, numbers, _ or -")
  if (!["PERCENTAGE", "FIXED"].includes(type) || !Number.isFinite(value) || value <= 0) throw new Error("Invalid discount type or value")
  if (type === "PERCENTAGE" && value > 100) throw new Error("Percentage discount cannot exceed 100%")
  if (type === "FIXED" && maxDiscount != null) throw new Error("Maximum discount is only valid for percentage coupons")
  if (!Number.isFinite(minOrder) || minOrder < 0 || (maxDiscount != null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) || (usageLimit != null && (!Number.isInteger(usageLimit) || usageLimit < 1)) || (perCustomer != null && (!Number.isInteger(perCustomer) || perCustomer < 1))) throw new Error("Invalid coupon limits")
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(expiryDate.getTime()) || expiryDate <= startDate) throw new Error("Invalid coupon dates")
  return { code, type: type as any, value, minOrder, maxDiscount, startDate, expiryDate, usageLimit, perCustomer, active: body.active !== false, applicableCategories: Array.isArray(body.applicableCategories) ? body.applicableCategories.map(String) : [], applicableProductIds: Array.isArray(body.applicableProductIds) ? body.applicableProductIds.map(String) : [] }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN"])
  if (response) return response
  try {
    const body = await request.json()
    const data = parseCoupon(body)
    const duplicate = await prisma.coupon.findFirst({ where: { code: data.code, NOT: { id: params.id } }, select: { id: true } })
    if (duplicate) return NextResponse.json({ error: "Coupon code already exists" }, { status: 400 })
    const coupon = await prisma.coupon.update({ where: { id: params.id }, data })
    return NextResponse.json(coupon)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update coupon"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN"])
  if (response) return response
  try {
    const body = await request.json()
    if (typeof body.active !== "boolean") return NextResponse.json({ error: "Active must be a boolean" }, { status: 400 })
    const coupon = await prisma.coupon.update({ where: { id: params.id }, data: { active: body.active } })
    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Error changing coupon status:", error)
    return NextResponse.json({ error: "Failed to change coupon status" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN"])
  if (response) return response
  try {
    const usage = await prisma.couponUsage.count({ where: { couponId: params.id } })
    if (usage > 0) {
      await prisma.coupon.update({ where: { id: params.id }, data: { active: false } })
      return NextResponse.json({ message: "Coupon has usage history and was deactivated instead" })
    }
    await prisma.coupon.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Coupon deleted successfully" })
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 })
  }
}
