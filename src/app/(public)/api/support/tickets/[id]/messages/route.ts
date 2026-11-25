import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 })
  try {
    const body = await request.json()
    const message = String(body.message ?? "").trim().slice(0, 5000)
    if (message.length < 2) return NextResponse.json({ error: "Enter a message." }, { status: 400 })

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: (await params).id, userId: session.user.id },
      select: { id: true, status: true },
    })
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 })
    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") return NextResponse.json({ error: "This ticket is closed. Open a new ticket if you need more help." }, { status: 409 })

    const result = await prisma.$transaction(async tx => {
      const saved = await tx.supportTicketMessage.create({ data: { ticketId: ticket.id, senderId: session.user.id, isStaff: false, message } })
      await tx.supportTicket.update({ where: { id: ticket.id }, data: { status: "OPEN" } })
      return saved
    })
    return NextResponse.json({ message: result }, { status: 201 })
  } catch (error) {
    console.error("Customer support reply failed:", error)
    return NextResponse.json({ error: "Unable to send your reply." }, { status: 500 })
  }
}
