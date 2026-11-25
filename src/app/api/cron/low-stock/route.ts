import { NextRequest, NextResponse } from "next/server"
import { timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 60

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
  const recipient = process.env.ADMIN_ORDER_EMAIL || process.env.SUPER_ADMIN_EMAIL
  if (!apiKey || !from || !recipient) {
    return NextResponse.json({ error: "Stock alert email settings are incomplete." }, { status: 503 })
  }

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      sku: true,
      stock: true,
      lowStock: true,
      variants: { select: { color: true, size: true, sku: true, stock: true } },
    },
    orderBy: { stock: "asc" },
    take: 1000,
  })

  const lowProducts = products.filter(product => product.stock <= product.lowStock || product.variants.some(variant => variant.stock <= product.lowStock))
  if (!lowProducts.length) return NextResponse.json({ checked: 0, sent: false, message: "No low-stock products." })

  const rows = lowProducts.map(product => {
    const variants = product.variants.filter(variant => variant.stock <= product.lowStock).map(variant => `<li>${variant.color} / ${variant.size} · SKU ${variant.sku} · ${variant.stock} left</li>`).join("")
    return `<tr><td style="padding:10px;border-bottom:1px solid #eee">${product.name}<br><small>${product.sku}</small>${variants ? `<ul>${variants}</ul>` : ""}</td><td style="padding:10px;border-bottom:1px solid #eee">${product.stock}</td><td style="padding:10px;border-bottom:1px solid #eee">${product.lowStock}</td></tr>`
  }).join("")
  const site = (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://noore-nine.vercel.app").replace(/\/$/, "")
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [recipient],
      subject: `NOORÉ low-stock alert · ${lowProducts.length} product(s)`,
      html: `<div style="font-family:Arial,sans-serif;color:#343a30;max-width:760px;margin:auto;padding:28px"><h1>NOORÉ stock alert</h1><p>The following active products or variants are at or below their low-stock threshold.</p><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Product</th><th align="left">Stock</th><th align="left">Alert level</th></tr></thead><tbody>${rows}</tbody></table><p><a href="${site}/admin/products">Review inventory in admin</a></p></div>`,
    }),
  })
  if (!response.ok) {
    console.error("Low-stock alert email failed:", response.status, (await response.text()).slice(0, 300))
    return NextResponse.json({ error: "Unable to send stock alert." }, { status: 502 })
  }
  return NextResponse.json({ checked: lowProducts.length, sent: true })
}
