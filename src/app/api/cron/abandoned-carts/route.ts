import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendAbandonedCartEmail } from "@/lib/notifications"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const carts = await prisma.cart.findMany({
    where: {
      updatedAt: { lt: cutoff },
      abandonedReminderAt: null,
      items: { some: {} },
    },
    take: 100,
    orderBy: { updatedAt: "asc" },
    include: {
      user: { select: { email: true, name: true } },
      items: { select: { quantity: true } },
    },
  })

  let sent = 0
  let skipped = 0
  for (const cart of carts) {
    try {
      const result = await sendAbandonedCartEmail({
        to: cart.user.email,
        customerName: cart.user.name,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      })
      if (result.sent) {
        await prisma.cart.update({
          where: { id: cart.id },
          data: { abandonedReminderAt: new Date() },
        })
        sent++
      } else {
        skipped++
      }
    } catch (error) {
      skipped++
      console.error("Abandoned-cart reminder failed for cart:", cart.id, error)
    }
  }

  return NextResponse.json({ success: true, eligible: carts.length, sent, skipped })
}
