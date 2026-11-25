import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (guard.response) return guard.response
  const params = request.nextUrl.searchParams
  const activeParam = params.get("active")
  const active = activeParam === "true" ? true : activeParam === "false" ? false : undefined
  const q = params.get("q")?.trim().slice(0, 100)
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      ...(active !== undefined ? { active } : {}),
      ...(q ? { email: { contains: q, mode: "insensitive" } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { id: true, email: true, active: true, createdAt: true, updatedAt: true },
  })
  if (params.get("format") === "csv") {
    const csv = ["Email,Status,Subscribed At", ...subscribers.map(row => `"${row.email.replace(/"/g, '""')}",${row.active ? "Active" : "Unsubscribed"},${row.createdAt.toISOString()}`)].join("\n")
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="noore-newsletter-subscribers.csv"' } })
  }
  return NextResponse.json({ subscribers })
}
