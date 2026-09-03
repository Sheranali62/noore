import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const code = String(body.code || "").trim().toUpperCase()
    const subtotal = Number(body.subtotal || 0)
    if (!code || !Number.isFinite(subtotal) || subtotal < 0) return NextResponse.json({ error: "Enter a valid coupon and subtotal." }, { status: 400 })

    const coupon = await prisma.coupon.findUnique({ where: { code } })
    const now = new Date()
    if (!coupon || !coupon.active) return NextResponse.json({ error: "Invalid coupon code." }, { status: 400 })
    if (now < coupon.startDate || now > coupon.expiryDate) return NextResponse.json({ error: "This coupon is no longer active." }, { status: 400 })
    if (subtotal < coupon.minOrder) return NextResponse.json({ error: `Minimum order for this coupon is PKR ${coupon.minOrder.toLocaleString()}.` }, { status: 400 })
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return NextResponse.json({ error: "This coupon has reached its usage limit." }, { status: 400 })

    const session = await getServerSession(authOptions)
    if (session?.user?.id && coupon.perCustomer) {
      const usedByCustomer = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: session.user.id } })
      if (usedByCustomer >= coupon.perCustomer) return NextResponse.json({ error: "You have already used this coupon the maximum number of times." }, { status: 400 })
    }

    let discount = coupon.type === "FIXED" ? coupon.value : subtotal * (coupon.value / 100)
    if (coupon.maxDiscount !== null) discount = Math.min(discount, coupon.maxDiscount)
    discount = Math.max(0, Math.min(discount, subtotal))

    return NextResponse.json({ coupon: { code: coupon.code, type: coupon.type, value: coupon.value }, discount })
  } catch (error) {
    console.error("Coupon validation error:", error)
    return NextResponse.json({ error: "Unable to validate coupon." }, { status: 500 })
  }
}
