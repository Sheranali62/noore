import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(["SUPER_ADMIN", "ADMIN"])
  if (guard.response) return guard.response
  const params = request.nextUrl.searchParams
  const take = Math.min(200, Math.max(20, Number(params.get("take") || 100)))
  const entityType = params.get("entityType")?.trim()
  const logs = await prisma.auditLog.findMany({
    where: entityType ? { entityType } : undefined,
    orderBy: { createdAt: "desc" },
    take,
  })
  return NextResponse.json({ logs })
}
