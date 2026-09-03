import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response
  try {
    const body = await request.json()
    if (!body.heading || !body.image) return NextResponse.json({ error: "Heading and desktop image are required" }, { status: 400 })
    const max = await prisma.heroBanner.aggregate({ _max: { sortOrder: true } })
    const banner = await prisma.heroBanner.create({
      data: {
        heading: String(body.heading).trim(),
        subtitle: body.subtitle ? String(body.subtitle).trim() : null,
        image: String(body.image).trim(),
        mobileImage: body.mobileImage ? String(body.mobileImage).trim() : null,
        video: body.video ? String(body.video).trim() : null,
        buttonText: body.buttonText ? String(body.buttonText).trim() : null,
        buttonUrl: body.buttonUrl ? String(body.buttonUrl).trim() : null,
        active: body.active !== false,
        sortOrder: (max._max.sortOrder ?? 0) + 1,
      },
    })
    return NextResponse.json({ banner })
  } catch {
    return NextResponse.json({ error: "Unable to create banner" }, { status: 500 })
  }
}
