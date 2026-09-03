import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const defaults = {
  siteName: "NOORÉ",
  announcementText: "FREE SHIPPING ON ORDERS ABOVE PKR 5,000",
  freeShippingThreshold: 5000,
  standardShipping: 250,
  expressShipping: 500,
  currency: "PKR",
}

type PublicSettings = typeof defaults

export async function GET() {
  const rows = await prisma.setting.findMany({ where: { key: { in: Object.keys(defaults) } } })
  const settings: PublicSettings = { ...defaults }
  for (const row of rows) {
    if (row.key === "siteName" || row.key === "announcementText" || row.key === "currency") {
      settings[row.key] = row.value
    } else if (row.key === "freeShippingThreshold" || row.key === "standardShipping" || row.key === "expressShipping") {
      settings[row.key] = Number(row.value)
    }
  }
  return NextResponse.json({ settings })
}
