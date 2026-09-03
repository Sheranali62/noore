import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"

export const dynamic = "force-dynamic"

const DEFAULTS: Record<string, string> = {
  siteName: "NOORÉ",
  announcementText: "FREE SHIPPING ON ORDERS ABOVE PKR 5,000",
  freeShippingThreshold: "5000",
  standardShipping: "250",
  expressShipping: "500",
  currency: "PKR",
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.session) return auth.response
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.keys(DEFAULTS) } } })
  const settings: Record<string, string> = { ...DEFAULTS }
  for (const row of rows) settings[row.key] = row.value
  return NextResponse.json({ settings })
}

export async function PUT(request: Request) {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN"])
  if (!auth.session) return auth.response
  const body = await request.json()
  const keys = Object.keys(DEFAULTS)
  const values: Record<string, string> = {}
  for (const key of keys) {
    if (typeof body?.[key] !== "string") return NextResponse.json({ error: `${key} must be a string` }, { status: 400 })
    values[key] = body[key].trim()
  }
  for (const key of ["freeShippingThreshold", "standardShipping", "expressShipping"]) {
    const value = Number(values[key])
    if (!Number.isFinite(value) || value < 0) return NextResponse.json({ error: `${key} must be a valid non-negative number` }, { status: 400 })
  }
  if (!values.siteName || !values.currency) return NextResponse.json({ error: "Site name and currency are required" }, { status: 400 })

  await prisma.$transaction(Object.entries(values).map(([key, value]) =>
    prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
  ))
  return NextResponse.json({ settings: values, message: "Settings saved successfully" })
}
