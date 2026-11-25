import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enforceRateLimit } from "@/lib/rate-limit"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin")
  if (
    (origin && new URL(origin).origin !== request.nextUrl.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return NextResponse.json({ error: "Cross-site support messages are not allowed." }, { status: 403 })
  }
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Login required" }, { status: 401 })
  const rateLimit = await enforceRateLimit(request, "support-ticket-message", 20, 60 * 60 * 1000, session.user.id)
  if (rateLimit) return rateLimit
  try {
    const contentType = request.headers.get("content-type") ?? ""
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "A JSON request body is required." }, { status: 415 })
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0)
    if (contentLength > 12 * 1024) return NextResponse.json({ error: "Message request is too large." }, { status: 413 })
    const body = await request.json()
    const message = String(body.message ?? "").trim()
    if (message.length < 2 || message.length > 5000) return NextResponse.json({ error: "Enter a message of up to 5,000 characters." }, { status: 400 })

    const ticket = await prisma.supportTicket.findFirst({
      where: { id: (await params).id, userId: session.user.id },
      select: { id: true, status: true },
    })
    if (!ticket) return NextResponse.json({ error: "Ticket not found." }, { status: 404 })
    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") return NextResponse.json({ error: "This ticket is closed. Open a new ticket if you need more help." }, { status: 409 })

    const result = await prisma.$transaction(async tx => {
      const reopened = await tx.supportTicket.updateMany({
        where: { id: ticket.id, userId: session.user.id, status: { notIn: ["CLOSED", "RESOLVED"] } },
        data: { status: "OPEN" },
      })
      if (reopened.count !== 1) throw new Error("TICKET_CLOSED")
      return tx.supportTicketMessage.create({
        data: { ticketId: ticket.id, senderId: session.user.id, isStaff: false, message },
      })
    })
    return NextResponse.json(
      { message: result },
      { status: 201, headers: { "Cache-Control": "private, no-store, max-age=0" } }
    )
  } catch (error) {
    if (error instanceof Error && error.message === "TICKET_CLOSED") {
      return NextResponse.json({ error: "This ticket is closed. Open a new ticket if you need more help." }, { status: 409 })
    }
    console.error("Customer support reply failed:", error)
    return NextResponse.json({ error: "Unable to send your reply." }, { status: 500 })
  }
}
