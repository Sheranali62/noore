import { NextRequest, NextResponse } from "next/server"
import { getStudioWorkspace } from "@/lib/studio-workspace"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const source = "/" + slug.join("/")
  const workspace = await getStudioWorkspace()
  const rule = workspace.redirects.find(item => item.enabled && item.from === source)
  if (!rule) return new NextResponse("Not found", { status: 404 })
  return NextResponse.redirect(new URL(rule.to, request.url), rule.status)
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ slug: string[] }> }) {
  return GET(request, context)
}
