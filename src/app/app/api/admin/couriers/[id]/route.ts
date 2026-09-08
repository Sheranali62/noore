import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (response) return response
  try {
    const body = await request.json()
    const current = await prisma.courierCompany.findUnique({ where: { id: params.id } })
    if (!current) return NextResponse.json({ error: "Courier company not found" }, { status: 404 })
    const data: any = {}
    for (const key of ["name","accountNumber","contractNumber","contactName","contactPhone","contactEmail","pickupAddress","pickupCity","serviceNotes","apiBaseUrl"]) if (body[key] !== undefined) data[key] = String(body[key] ?? "").trim() || null
    if (body.apiKey !== undefined && String(body.apiKey).trim()) data.apiKey = String(body.apiKey).trim()
    if (body.apiSecret !== undefined && String(body.apiSecret).trim()) data.apiSecret = String(body.apiSecret).trim()
    if (body.active !== undefined) data.active = Boolean(body.active)
    const courier = await prisma.courierCompany.update({ where: { id: params.id }, data, select: { id: true, name: true, accountNumber: true, contractNumber: true, contactName: true, contactPhone: true, contactEmail: true, pickupAddress: true, pickupCity: true, serviceNotes: true, apiBaseUrl: true, active: true, createdAt: true, updatedAt: true } })
    return NextResponse.json(courier)
  } catch (error) {
    console.error("Update courier error:", error)
    return NextResponse.json({ error: "Failed to update courier company" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (response) return response
  try {
    const orders = await prisma.order.count({ where: { courierCompanyId: params.id } })
    if (orders) return NextResponse.json({ error: "Courier is already used on orders. Disable it instead of deleting." }, { status: 409 })
    await prisma.courierCompany.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Courier company deleted" })
  } catch (error) {
    console.error("Delete courier error:", error)
    return NextResponse.json({ error: "Failed to delete courier company" }, { status: 500 })
  }
}
