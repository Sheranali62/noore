import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { active: true },
      orderBy: [
        { sortOrder: "asc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        active: true,
        sortOrder: true,
      },
    })

    return NextResponse.json(categories, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    })
  } catch (error) {
    console.error("Public categories error:", error)
    return NextResponse.json(
      { error: "Failed to load categories" },
      { status: 500 },
    )
  }
}
