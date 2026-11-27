import { notFound, redirect } from "next/navigation"
import { getStudioWorkspace } from "@/lib/studio-workspace"

export const dynamic = "force-dynamic"

export default async function LegacyUrlRedirect({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const source = "/" + slug.join("/")
  const workspace = await getStudioWorkspace()
  const rule = workspace.redirects.find(item => item.enabled && item.from === source)
  if (!rule) notFound()
  redirect(rule.to)
}
