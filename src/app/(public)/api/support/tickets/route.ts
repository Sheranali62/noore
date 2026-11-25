import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 })
  try {
    const tickets = await prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        order: { select: { orderNumber: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    })
    return NextResponse.json({ tickets }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Customer support tickets load failed:", error)
    return NextResponse.json({ error: "Unable to load support tickets." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 })
  try {
    const body = await request.json()
    const subject = String(body.subject ?? "").trim().slice(0, 160)
    const category = String(body.category ?? "General").trim().slice(0, 60)
    const message = String(body.message ?? "").trim().slice(0, 5000)
    const orderId = String(body.orderId ?? "").trim() || null
    if (!subject || message.length < 5) return NextResponse.json({ error: "Enter a subject and a message of at least 5 characters." }, { status: 400 })

    if (orderId) {
      const order = await prisma.order.findFirst({ where: { id: orderId, userId: session.user.id }, select: { id: true } })
      if (!order) return NextResponse.json({ error: "The selected order was not found." }, { status: 404 })
    }

    const ticket = await prisma.$transaction(async tx => {
      const created = await tx.supportTicket.create({
        data: {
          userId: session.user.id,
          orderId,
          subject,
          category,
          messages: { create: { senderId: session.user.id, isStaff: false, message } },
        },
        include: { order: { select: { orderNumber: true } }, messages: true },
      })
      await tx.auditLog.create({
        data: { actorId: session.user.id, action: "SUPPORT_TICKET_CREATED", entityType: "SupportTicket", entityId: created.id, details: { subject, category } },
      })
      return created
    })
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error("Create support ticket failed:", error)
    return NextResponse.json({ error: "Unable to create your support ticket." }, { status: 500 })
  }
}
