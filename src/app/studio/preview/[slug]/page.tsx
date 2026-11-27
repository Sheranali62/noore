import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin"
import { getStudioWorkspace } from "@/lib/studio-workspace"
import StudioPageRenderer from "@/components/studio/studio-page-renderer"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Studio draft preview", robots: { index: false, follow: false } }

export default async function StudioDraftPreview({ params }: { params: Promise<{ slug: string }> }) {
  const auth = await requireAdmin(["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"])
  if (!auth.session) redirect("/login?callbackUrl=/studio")
  const { slug } = await params
  const workspace = await getStudioWorkspace()
  const page = workspace.pages.find(item => item.slug === slug)
  if (!page) notFound()
  return <div><div className="sticky top-0 z-[100] flex items-center justify-between bg-[#171715] px-4 py-3 text-xs text-white"><span className="font-semibold text-[#e8c98e]">NOORÉ · PRIVATE DRAFT PREVIEW</span><a href="/studio" className="underline underline-offset-4">Back to Studio</a></div><StudioPageRenderer page={page.draft} preview /></div>
}
