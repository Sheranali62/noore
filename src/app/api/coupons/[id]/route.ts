import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET single coupon
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const coupon = await prisma.coupon.findUnique({
      where: { id: params.id },
    })

    if (!coupon) {
      return NextResponse.json(
        { error: "Coupon not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Error fetching coupon:", error)
    return NextResponse.json(
      { error: "Failed to fetch coupon" },
      { status: 500 }
    )
  }
}

// PUT update coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
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

    return NextResponse.json(coupon)
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json(
      { error: "Failed to update coupon" },
      { status: 500 }
    )
  }
}

// DELETE coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.coupon.delete({
      where: { id: params.id },
    })

    return NextResponse.json(
      { message: "Coupon deleted successfully" }
    )
  } catch (error) {
    console.error("Error deleting coupon:", error)
    return NextResponse.json(
      { error: "Failed to delete coupon" },
      { status: 500 }
    )
  }
}