import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

function cleanString(value: unknown) {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text || null
}

export async function POST(request: Request) {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response
  try {
    const body = await request.json()
    const heading = String(body?.heading || "").trim()
    const image = String(body?.image || "").trim()
    if (!heading || !image) return NextResponse.json({ error: "Heading and desktop image are required" }, { status: 400 })
    const last = await prisma.heroBanner.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } })
    const banner = await prisma.heroBanner.create({
      data: {
        heading,
        subtitle: cleanString(body.subtitle),
        image,
        mobileImage: cleanString(body.mobileImage),
        video: cleanString(body.video),
        buttonText: cleanString(body.buttonText),
        buttonUrl: cleanString(body.buttonUrl),
        active: body.active !== false,
        sortOrder: Number.isFinite(Number(body.sortOrder)) ? Number(body.sortOrder) : (last?.sortOrder || 0) + 1,
      },
    })
    return NextResponse.json({ banner }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Failed to create hero banner" }, { status: 500 })
  }
}
