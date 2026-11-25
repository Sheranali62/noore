import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"
import { sendSupportTicketEmail } from "@/lib/notifications"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 })
  try {
    const [tickets, orders] = await Promise.all([
      prisma.supportTicket.findMany({
        where: { userId: session.user.id },
        orderBy: { updatedAt: "desc" },
        include: {
          order: { select: { orderNumber: true } },
          messages: { orderBy: { createdAt: "asc" } },
        },
      }),
      prisma.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, orderNumber: true },
      }),
    ])
    return NextResponse.json({ tickets, orders }, { headers: { "Cache-Control": "private, no-store" } })
  } catch (error) {
    console.error("Customer support tickets load failed:", error)
    return NextResponse.json({ error: "Unable to load support tickets." }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin")
  if (
    (origin && new URL(origin).origin !== request.nextUrl.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return NextResponse.json({ error: "Cross-site support requests are not allowed." }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 })
  const limited = await enforceRateLimit(request, "support-ticket-create", 8, 60 * 60 * 1000, session.user.id)
  if (limited) return limited
  try {
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "A JSON request body is required." }, { status: 415 })
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 16 * 1024) return NextResponse.json({ error: "Support request is too large." }, { status: 413 })
    const body = await request.json()
    const subject = String(body.subject ?? "").trim().slice(0, 160)
    const category = String(body.category ?? "General").trim().slice(0, 60)
    const message = String(body.message ?? "").trim().slice(0, 5000)
    const orderId = String(body.orderId ?? "").trim() || null
    if (orderId && orderId.length > 128) return NextResponse.json({ error: "The selected order is invalid." }, { status: 400 })
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
    const supportRecipient = process.env.ADMIN_ORDER_EMAIL || process.env.EMAIL_FROM
    if (supportRecipient) {
      void sendSupportTicketEmail({
        to: supportRecipient,
        ticketId: ticket.id,
        subject: ticket.subject,
        message,
        staffReply: false,
      }).catch(error => console.error("New support ticket email failed:", error))
    }
    return NextResponse.json({ ticket }, { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } })
  } catch (error) {
    console.error("Create support ticket failed:", error)
    return NextResponse.json({ error: "Unable to create your support ticket." }, { status: 500 })
  }
}
