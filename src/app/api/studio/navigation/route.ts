import { NextResponse } from "next/server"
import { getStudioWorkspace } from "@/lib/studio-workspace"

export const dynamic = "force-dynamic"

export async function GET() {
  const workspace = await getStudioWorkspace()
  const items = workspace.navigation.filter(item => item.enabled).sort((a, b) => a.sortOrder - b.sortOrder)
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } })
}
