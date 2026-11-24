import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { normalizeHomepageDesign } from "@/lib/homepage-design"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const row = await prisma.setting.findUnique({ where: { key: "homepage_design" } })
    let saved: unknown = {}
    try { saved = row?.value ? JSON.parse(row.value) : {} } catch {}
    return NextResponse.json({ design: normalizeHomepageDesign(saved) }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    })
  } catch {
    return NextResponse.json({ error: "Unable to load storefront design" }, { status: 500 })
  }
}
