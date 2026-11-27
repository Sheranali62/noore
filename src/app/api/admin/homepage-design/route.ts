import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { normalizeHomepageDesign } from "@/lib/homepage-design"

export const dynamic = "force-dynamic"
const KEY = "homepage_design"

export async function GET() {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response
  const row = await prisma.setting.findUnique({ where: { key: KEY } })
  let saved: unknown = {}
  try { saved = row?.value ? JSON.parse(row.value) : {} } catch {}
  return NextResponse.json({ design: normalizeHomepageDesign(saved) })
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response

  // Preview deployments share the connected Supabase project with production.
  // Never allow a preview editor to write the live homepage setting.
  if (process.env.VERCEL_ENV === "preview") {
    return NextResponse.json(
      { error: "Publishing is disabled in preview. Your edits remain local; publish from the production admin after review." },
      { status: 409 },
    )
  }

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) }
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Design settings must be an object" }, { status: 400 })
  const design = normalizeHomepageDesign(body)
  const currentRow = await prisma.setting.findUnique({ where: { key: KEY }, select: { value: true } })
  let current: unknown = {}
  try { current = currentRow?.value ? JSON.parse(currentRow.value) : {} } catch {}
  const previousDesign = normalizeHomepageDesign(current)

  // Keep a bounded history in the existing settings table: no schema migration required.
  const historyRow = await prisma.setting.findUnique({ where: { key: "homepage_design_versions" }, select: { value: true } })
  let versions: Array<{ id: string; createdAt: string; label: string; design: typeof previousDesign }> = []
  try { versions = historyRow?.value ? JSON.parse(historyRow.value) : [] } catch { versions = [] }
  if (!Array.isArray(versions)) versions = []
  if (JSON.stringify(previousDesign) !== JSON.stringify(design)) {
    versions = [{
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      label: "Saved homepage design",
      design: previousDesign,
    }, ...versions].slice(0, 30)
    await prisma.setting.upsert({
      where: { key: "homepage_design_versions" },
      create: { key: "homepage_design_versions", value: JSON.stringify(versions) },
      update: { value: JSON.stringify(versions) },
    })
  }

  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(design) },
    update: { value: JSON.stringify(design) },
  })
  return NextResponse.json({ design, message: "Homepage design saved.", versions })
}
