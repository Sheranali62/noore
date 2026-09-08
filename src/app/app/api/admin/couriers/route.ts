import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (response) return response
  const couriers = await prisma.courierCompany.findMany({ orderBy: [{ active: "desc" }, { name: "asc" }], select: { id: true, name: true, accountNumber: true, contractNumber: true, contactName: true, contactPhone: true, contactEmail: true, pickupAddress: true, pickupCity: true, serviceNotes: true, apiBaseUrl: true, active: true, createdAt: true, updatedAt: true } })
  return NextResponse.json(couriers)
}

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (response) return response
  try {
    const body = await request.json()
    const name = String(body.name ?? "").trim()
    if (!name) return NextResponse.json({ error: "Courier company name is required" }, { status: 400 })
    const courier = await prisma.courierCompany.create({ data: { name, accountNumber: String(body.accountNumber ?? "").trim() || null, contractNumber: String(body.contractNumber ?? "").trim() || null, contactName: String(body.contactName ?? "").trim() || null, contactPhone: String(body.contactPhone ?? "").trim() || null, contactEmail: String(body.contactEmail ?? "").trim() || null, pickupAddress: String(body.pickupAddress ?? "").trim() || null, pickupCity: String(body.pickupCity ?? "").trim() || null, serviceNotes: String(body.serviceNotes ?? "").trim() || null, apiBaseUrl: String(body.apiBaseUrl ?? "").trim() || null, apiKey: String(body.apiKey ?? "").trim() || null, apiSecret: String(body.apiSecret ?? "").trim() || null, active: body.active !== false } })
    return NextResponse.json({ ...courier, apiKey: undefined, apiSecret: undefined }, { status: 201 })
  } catch (error) {
    console.error("Create courier error:", error)
    return NextResponse.json({ error: "Failed to save courier company" }, { status: 500 })
  }
}
