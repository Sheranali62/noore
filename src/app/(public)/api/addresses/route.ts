import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

const clean = (value: unknown) => typeof value === "string" ? value.trim() : ""

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const addresses = await prisma.address.findMany({ where: { userId: session.user.id }, orderBy: [{ default: "desc" }, { createdAt: "desc" }] })
  return NextResponse.json({ addresses })
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const data = {
      name: clean(body.name), phone: clean(body.phone), address: clean(body.address),
      city: clean(body.city), province: clean(body.province), postal: clean(body.postal),
      default: Boolean(body.default),
    }
    if (!data.name || !data.phone || !data.address || !data.city || !data.province || !data.postal) {
      return NextResponse.json({ error: "Please complete all address fields" }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      if (data.default) await tx.address.updateMany({ where: { userId: session.user.id }, data: { default: false } })
      const count = await tx.address.count({ where: { userId: session.user.id } })
      return tx.address.create({ data: { ...data, userId: session.user.id, default: data.default || count === 0 } })
    })
    return NextResponse.json({ address: result }, { status: 201 })
  } catch (error) {
    console.error("Address creation failed", error)
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const body = await request.json()
    const id = clean(body.id)
    if (!id) return NextResponse.json({ error: "Address ID is required" }, { status: 400 })
    const existing = await prisma.address.findFirst({ where: { id, userId: session.user.id } })
    if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 })
    const data = {
      name: clean(body.name), phone: clean(body.phone), address: clean(body.address),
      city: clean(body.city), province: clean(body.province), postal: clean(body.postal), default: Boolean(body.default),
    }
    if (Object.values(data).some((value) => value === "")) return NextResponse.json({ error: "Please complete all address fields" }, { status: 400 })
    const result = await prisma.$transaction(async (tx) => {
      if (data.default) await tx.address.updateMany({ where: { userId: session.user.id, NOT: { id } }, data: { default: false } })
      return tx.address.update({ where: { id }, data })
    })
    return NextResponse.json({ address: result })
  } catch (error) {
    console.error("Address update failed", error)
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const id = clean((await request.json()).id)
    const address = await prisma.address.findFirst({ where: { id, userId: session.user.id } })
    if (!address) return NextResponse.json({ error: "Address not found" }, { status: 404 })
    const used = await prisma.order.count({ where: { addressId: id } })
    if (used > 0) return NextResponse.json({ error: "This address is linked to an order and cannot be deleted" }, { status: 409 })
    await prisma.address.delete({ where: { id } })
    if (address.default) {
      const next = await prisma.address.findFirst({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } })
      if (next) await prisma.address.update({ where: { id: next.id }, data: { default: true } })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Address deletion failed", error)
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 })
  }
}
