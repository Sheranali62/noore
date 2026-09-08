import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

// GET all coupons
export async function GET(_request: NextRequest) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN"])
  if (response) return response

  try {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(coupons)
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupons" },
      { status: 500 }
    )
  }
}

// POST new coupon
export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN"])
  if (response) return response

  try {
    const body = await request.json()
    const code = String(body.code ?? "").trim().toUpperCase()
    const type = String(body.type ?? "")
    const value = Number(body.value)
    const minOrder = Number(body.minOrder ?? 0)
    const maxDiscount = body.maxDiscount == null || body.maxDiscount === "" ? null : Number(body.maxDiscount)
    const usageLimit = body.usageLimit == null || body.usageLimit === "" ? null : Number(body.usageLimit)
    const perCustomer = body.perCustomer == null || body.perCustomer === "" ? null : Number(body.perCustomer)
    const startDate = new Date(body.startDate)
    const expiryDate = new Date(body.expiryDate)

    if (!code || !["PERCENTAGE", "FIXED"].includes(type) || !Number.isFinite(value) || value <= 0 || !body.startDate || !body.expiryDate) {
      return NextResponse.json(
        { error: "Invalid or missing required fields" },
        { status: 400 }
      )
    }

    if (!/^[A-Z0-9_-]{3,50}$/.test(code)) {
      return NextResponse.json({ error: "Coupon code must be 3-50 characters using letters, numbers, _ or -" }, { status: 400 })
    }
    if (!Number.isFinite(minOrder) || minOrder < 0 || (maxDiscount != null && (!Number.isFinite(maxDiscount) || maxDiscount < 0)) || (usageLimit != null && (!Number.isInteger(usageLimit) || usageLimit < 1)) || (perCustomer != null && (!Number.isInteger(perCustomer) || perCustomer < 1))) {
      return NextResponse.json({ error: "Invalid coupon limits" }, { status: 400 })
    }
    if (type === "PERCENTAGE" && value > 100) return NextResponse.json({ error: "Percentage discount cannot exceed 100%" }, { status: 400 })
    if (type === "FIXED" && maxDiscount != null) return NextResponse.json({ error: "Maximum discount is only valid for percentage coupons" }, { status: 400 })
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(expiryDate.getTime()) || expiryDate <= startDate) return NextResponse.json({ error: "Invalid coupon dates" }, { status: 400 })

    const existingCoupon = await prisma.coupon.findUnique({
      where: { code },
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type: type as any,
        value,
        minOrder,
        maxDiscount,
        startDate,
        expiryDate,
        usageLimit,
        perCustomer,
        applicableCategories: Array.isArray(body.applicableCategories) ? body.applicableCategories.map(String) : [],
        applicableProductIds: Array.isArray(body.applicableProductIds) ? body.applicableProductIds.map(String) : [],
        active: body.active !== undefined ? body.active : true,
      },
    })

    return NextResponse.json(coupon, { status: 201 })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json(
      { error: "Failed to create coupon" },
      { status: 500 }
    )
  }
}