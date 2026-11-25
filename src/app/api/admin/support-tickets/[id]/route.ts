import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

const STATUSES = ["OPEN", "IN_PROGRESS", "WAITING_CUSTOMER", "RESOLVED", "CLOSED"] as const
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  try {
    const body = await request.json()
    const status = body.status as typeof STATUSES[number] | undefined
    const priority = body.priority as typeof PRIORITIES[number] | undefined
    if ((status && !STATUSES.includes(status)) || (priority && !PRIORITIES.includes(priority))) {
      return NextResponse.json({ error: "Invalid ticket status or priority." }, { status: 400 })
    }
    if (!status && !priority) return NextResponse.json({ error: "No ticket changes supplied." }, { status: 400 })
    const ticket = await prisma.supportTicket.update({
      where: { id: params.id },
      data: { ...(status ? { status } : {}), ...(priority ? { priority } : {}) },
    })
    await prisma.auditLog.create({
      data: { actorId: guard.session?.user?.id || null, action: "SUPPORT_TICKET_UPDATED", entityType: "SupportTicket", entityId: params.id, details: { status, priority } },
    })
    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Admin support ticket update failed:", error)
    return NextResponse.json({ error: "Unable to update this ticket." }, { status: 500 })
  }
}
