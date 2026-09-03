import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

type Params = { params: { id: string } }

export async function PUT(request: Request, { params }: Params) {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response
  try {
    const body = await request.json()
    if (!body.heading || !body.image) return NextResponse.json({ error: "Heading and desktop image are required" }, { status: 400 })
    const banner = await prisma.heroBanner.update({
      where: { id: params.id },
      data: {
        heading: String(body.heading).trim(),
        subtitle: body.subtitle ? String(body.subtitle).trim() : null,
        image: String(body.image).trim(),
        mobileImage: body.mobileImage ? String(body.mobileImage).trim() : null,
        video: body.video ? String(body.video).trim() : null,
        buttonText: body.buttonText ? String(body.buttonText).trim() : null,
        buttonUrl: body.buttonUrl ? String(body.buttonUrl).trim() : null,
        active: Boolean(body.active),
        ...(typeof body.sortOrder === "number" ? { sortOrder: Math.max(1, Math.floor(body.sortOrder)) } : {}),
      },
    })
    return NextResponse.json({ banner })
  } catch {
    return NextResponse.json({ error: "Unable to update banner" }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response
  try {
    await prisma.heroBanner.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Banner deleted" })
  } catch {
    return NextResponse.json({ error: "Unable to delete banner" }, { status: 500 })
  }
}
