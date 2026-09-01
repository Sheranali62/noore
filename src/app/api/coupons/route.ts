import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET all coupons
export async function GET(request: NextRequest) {
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
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.code || !body.type || !body.value || !body.startDate || !body.expiryDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if coupon code already exists
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: body.code },
    })

    if (existingCoupon) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      )
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code,
        type: body.type,
        value: body.value,
        minOrder: body.minOrder || 0,
        maxDiscount: body.maxDiscount || null,
        startDate: new Date(body.startDate),
        expiryDate: new Date(body.expiryDate),
        usageLimit: body.usageLimit || null,
        perCustomer: body.perCustomer || null,
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