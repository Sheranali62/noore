import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character)
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const supplied = request.headers.get("authorization") || ""
  const expected = secret ? `Bearer ${secret}` : ""
  const a = Buffer.from(supplied)
  const b = Buffer.from(expected)
  if (!secret || a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from) return NextResponse.json({ error: "Email service is not configured." }, { status: 503 })

  const now = new Date()
  const carts = await prisma.cart.findMany({
    where: {
      updatedAt: { lt: new Date(now.getTime() - 2 * 60 * 60 * 1000), gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
      abandonedReminderAt: null,
      items: { some: {} },
      user: { email: { not: "" } },
    },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: { select: { name: true, slug: true, images: true, status: true } }, variant: { select: { color: true, size: true } } } },
    },
    take: 100,
  })

  const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://noore-nine.vercel.app").replace(/\/$/, "")
  let sent = 0
  let failed = 0
  for (const cart of carts) {
    if (!cart.user.email) continue
    const recentOrder = await prisma.order.findFirst({
      where: {
        userId: cart.userId,
        createdAt: { gte: cart.updatedAt },
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      select: { id: true },
    })
    if (recentOrder) {
      await prisma.cart.update({ where: { id: cart.id }, data: { abandonedReminderAt: now } })
      continue
    }
    const lines = cart.items.filter(item => item.product.status === "ACTIVE").slice(0, 8)
    if (!lines.length) {
      await prisma.cart.update({ where: { id: cart.id }, data: { abandonedReminderAt: now } })
      continue
    }
    const products = lines.map(item => {
      const label = escapeHtml(item.product.name)
      const variant = item.variant ? ` · ${escapeHtml(item.variant.color)} / ${escapeHtml(item.variant.size)}` : ""
      return `<li style="padding:8px 0;border-bottom:1px solid #eee">${label}${variant} · Qty ${item.quantity}</li>`
    }).join("")
    const name = escapeHtml(cart.user.name || "there")
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [cart.user.email],
        subject: "Your NOORÉ selection is waiting",
        html: `<div style="font-family:Arial,sans-serif;color:#343a30;max-width:560px;margin:auto;padding:32px"><h1 style="letter-spacing:5px">NOORÉ</h1><p>Hello ${name},</p><p>You left a few pieces in your bag. Your selection is still waiting for you, while stock lasts.</p><ul style="padding-left:18px">${products}</ul><p style="margin:28px 0"><a href="${site}/cart" style="background:#535f4c;color:white;padding:14px 22px;text-decoration:none">RETURN TO YOUR BAG</a></p><p style="font-size:12px;color:#777">You are receiving this because you have an account and saved items in your NOORÉ cart.</p></div>`,
        text: `Hello ${cart.user.name || "there"}, your NOORÉ cart is waiting. Return to your bag: ${site}/cart`,
      }),
    }).catch(error => {
      console.error("Abandoned cart email failed:", error)
      return null
    })

    if (response?.ok) {
      await prisma.cart.update({ where: { id: cart.id }, data: { abandonedReminderAt: now } })
      sent++
    } else {
      failed++
      if (response) console.error("Abandoned cart email provider error:", response.status, (await response.text()).slice(0, 300))
    }
  }

  const expiredRateLimitBuckets = await prisma.rateLimitBucket.deleteMany({
    where: { updatedAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
  })

  return NextResponse.json({ processed: carts.length, sent, failed, expiredRateLimitBuckets: expiredRateLimitBuckets.count })
}
