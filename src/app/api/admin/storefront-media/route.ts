import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"
const KEY = "storefront_media"

export async function GET() {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response
  const setting = await prisma.setting.findUnique({ where: { key: KEY }, select: { value: true } })
  let media: Record<string, string> = {}
  try { media = setting?.value ? JSON.parse(setting.value) : {} } catch { media = {} }
  return NextResponse.json({ media })
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) return auth.response
  if (process.env.VERCEL_ENV === "preview") return NextResponse.json({ error: "Storefront image publishing is disabled in preview because it shares production data." }, { status: 409 })
  const body = await request.json()
  if (!body?.media || typeof body.media !== "object" || Array.isArray(body.media)) return NextResponse.json({ error: "Invalid media settings" }, { status: 400 })
  const entries = Object.entries(body.media as Record<string, unknown>)
  if (entries.length > 150 || entries.some(([key, value]) => !/^[a-zA-Z0-9:_ -]{1,120}$/.test(key) || typeof value !== "string" || value.length > 2048)) return NextResponse.json({ error: "Invalid image settings" }, { status: 400 })
  const media = Object.fromEntries(entries.map(([key, value]) => [key, (value as string).trim()])) as Record<string, string>
  await prisma.setting.upsert({ where: { key: KEY }, create: { key: KEY, value: JSON.stringify(media) }, update: { value: JSON.stringify(media) } })
  return NextResponse.json({ media, message: "Storefront images saved." })
}
