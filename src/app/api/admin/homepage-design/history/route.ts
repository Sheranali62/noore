import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import { normalizeHomepageDesign } from "@/lib/homepage-design"

export const dynamic = "force-dynamic"
const DESIGN_KEY = "homepage_design"
const HISTORY_KEY = "homepage_design_versions"
const ROLES = ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]

type Version = { id: string; createdAt: string; label: string; design: ReturnType<typeof normalizeHomepageDesign> }

async function readJsonSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key }, select: { value: true } })
  try { return row?.value ? JSON.parse(row.value) as T : fallback } catch { return fallback }
}

function previewBlocked() {
  return process.env.VERCEL_ENV === "preview"
}

export async function GET() {
  const auth = await requireAdmin(ROLES)
  if (!auth.session) return auth.response
  const versions = await readJsonSetting<Version[]>(HISTORY_KEY, [])
  return NextResponse.json({ versions: Array.isArray(versions) ? versions.slice(0, 30) : [] })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(ROLES)
  if (!auth.session) return auth.response
  if (previewBlocked()) {
    return NextResponse.json({ error: "Restoring versions is disabled in preview because it shares production data." }, { status: 409 })
  }

  let body: { versionId?: string }
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }) }
  if (!body.versionId || typeof body.versionId !== "string" || body.versionId.length > 80) {
    return NextResponse.json({ error: "Choose a valid version to restore." }, { status: 400 })
  }

  const versions = await readJsonSetting<Version[]>(HISTORY_KEY, [])
  const target = Array.isArray(versions) ? versions.find(version => version.id === body.versionId) : undefined
  if (!target?.design) return NextResponse.json({ error: "That version is no longer available." }, { status: 404 })

  const current = await readJsonSetting<unknown>(DESIGN_KEY, {})
  const nextVersions: Version[] = [
    { id: randomUUID(), createdAt: new Date().toISOString(), label: "Before version restore", design: normalizeHomepageDesign(current) },
    ...versions,
  ].slice(0, 30)

  await prisma.setting.upsert({
    where: { key: DESIGN_KEY },
    create: { key: DESIGN_KEY, value: JSON.stringify(normalizeHomepageDesign(target.design)) },
    update: { value: JSON.stringify(normalizeHomepageDesign(target.design)) },
  })
  await prisma.setting.upsert({
    where: { key: HISTORY_KEY },
    create: { key: HISTORY_KEY, value: JSON.stringify(nextVersions) },
    update: { value: JSON.stringify(nextVersions) },
  })

  return NextResponse.json({ design: normalizeHomepageDesign(target.design), versions: nextVersions, message: "Homepage design version restored." })
}
