import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const DEFAULT_SECTIONS = [
  ["hero", "Hero Slider"],
  ["categories", "Category Cards"],
  ["products", "Product Carousel"],
  ["banner", "Collection Banner"],
  ["luxury", "Luxury Section"],
  ["men", "Men Section"],
  ["accessories", "Accessories"],
  ["instagram", "Instagram Feed"],
  ["newsletter", "Newsletter"],
] as const

async function ensureSections() {
  const existing = await prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } })
  if (existing.length) return existing
  await prisma.$transaction(DEFAULT_SECTIONS.map(([type], index) =>
    prisma.homepageSection.create({ data: { type, enabled: type !== "instagram", sortOrder: index + 1 } })
  ))
  return prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } })
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.session) return auth.response
  const [sections, banners] = await Promise.all([
    ensureSections(),
    prisma.heroBanner.findMany({ orderBy: { sortOrder: "asc" } }),
  ])
  return NextResponse.json({ sections, banners })
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response
  const body = await request.json()
  if (!Array.isArray(body?.sections)) return NextResponse.json({ error: "sections must be an array" }, { status: 400 })

  const sections = body.sections as Array<{ id?: string; type?: string; enabled?: boolean; sortOrder?: number }>
  const current = await prisma.homepageSection.findMany()
  const currentIds = new Set(current.map(section => section.id))
  const seen = new Set<string>()
  for (let index = 0; index < sections.length; index += 1) {
    const section = sections[index]
    if (!section.id || !currentIds.has(section.id) || seen.has(section.id)) {
      return NextResponse.json({ error: "Invalid homepage section list" }, { status: 400 })
    }
    if (typeof section.enabled !== "boolean") return NextResponse.json({ error: "Invalid section enabled value" }, { status: 400 })
    seen.add(section.id)
  }
  if (seen.size !== current.length) return NextResponse.json({ error: "All homepage sections must be included" }, { status: 400 })

  await prisma.$transaction(sections.map((section, index) =>
    prisma.homepageSection.update({ where: { id: section.id }, data: { enabled: section.enabled!, sortOrder: index + 1 } })
  ))
  const updated = await prisma.homepageSection.findMany({ orderBy: { sortOrder: "asc" } })
  return NextResponse.json({ sections: updated, message: "Homepage layout saved" })
}
