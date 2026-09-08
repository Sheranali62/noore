import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, service: "noore", database: "connected" }, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("NOORE health check failed:", error)
    return NextResponse.json({ ok: false, service: "noore", database: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
}
