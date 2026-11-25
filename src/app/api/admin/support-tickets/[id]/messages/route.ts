import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"
import { sendSupportTicketEmail } from "@/lib/notifications"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "ORDER_MANAGER"])
  if (guard.response) return guard.response
  try {
    const body = await request.json()
    const message = String(body.message ?? "").trim().slice(0, 5000)
    if (message.length < 2) return NextResponse.json({ error: "Enter a reply." }, { status: 400 })
    const ticket = await prisma.supportTicket.findUnique({ where: { id: params.id }, select: { id: true, subject: true, user: { select: { email: true } } } })
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 })
    const saved = await prisma.$transaction(async tx => {
      const result = await tx.supportTicketMessage.create({ data: { ticketId: ticket.id, senderId: guard.session?.user?.id || null, isStaff: true, message } })
      await tx.supportTicket.update({ where: { id: ticket.id }, data: { status: "WAITING_CUSTOMER" } })
      await tx.auditLog.create({ data: { actorId: guard.session?.user?.id || null, action: "SUPPORT_TICKET_REPLIED", entityType: "SupportTicket", entityId: ticket.id, details: { messageId: result.id } } })
      return result
    })
    void sendSupportTicketEmail({
      to: ticket.user.email,
      ticketId: ticket.id,
      subject: ticket.subject,
      message,
      staffReply: true,
    }).catch(error => console.error("Support reply email failed:", error))
    return NextResponse.json({ message: saved }, { status: 201 })
  } catch (error) {
    console.error("Admin support reply failed:", error)
    return NextResponse.json({ error: "Unable to send the reply." }, { status: 500 })
  }
}
