import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/admin"
import {
  getStudioPageHistory, getStudioWorkspace, normalizeStudioPageVersion,
  normalizeStudioWorkspace, writeStudioHistory, writeStudioWorkspace,
  type StudioPage, type StudioPageHistory,
} from "@/lib/studio-workspace"

export const dynamic = "force-dynamic"
const ROLES = ["SUPER_ADMIN", "ADMIN", "CONTENT_MANAGER"]
const blocked = () => process.env.VERCEL_ENV === "preview"

async function audit(actorId: string | undefined, action: string, entityId: string | null, details: Record<string, unknown>) {
  try {
    await prisma.auditLog.create({ data: { actorId: actorId || null, action, entityType: "STUDIO", entityId, details: JSON.parse(JSON.stringify(details)) } })
  } catch { /* Studio saves must not fail because optional audit metadata is unavailable. */ }
}

export async function GET() {
  const auth = await requireAdmin(ROLES)
  if (!auth.session) return auth.response
  const [workspace, history] = await Promise.all([getStudioWorkspace(), getStudioPageHistory()])
  return NextResponse.json({ workspace, history })
}

export async function POST(request: Request) {
  const auth = await requireAdmin(ROLES)
  if (!auth.session) return auth.response
  if (blocked()) return NextResponse.json({ error: "Studio publishing and saving are disabled in Preview because it shares production data. Use Preview to inspect the workspace only." }, { status: 409 })
  const origin = request.headers.get("origin")
  if ((origin && new URL(origin).origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Cross-site Studio requests are not allowed." }, { status: 403 })
  }
  const contentLength = Number(request.headers.get("content-length") || 0)
  if (contentLength > 1_500_000) return NextResponse.json({ error: "Studio update is too large." }, { status: 413 })

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }) }
  const action = typeof body.action === "string" ? body.action : ""
  const workspace = await getStudioWorkspace()
  const history = await getStudioPageHistory()
  const actorId = auth.session.user?.id

  if (action === "save-page") {
    const pageInput = body.page as Record<string, unknown> | undefined
    if (!pageInput || typeof pageInput !== "object") return NextResponse.json({ error: "Page details are required." }, { status: 400 })
    const slug = typeof pageInput.slug === "string" ? pageInput.slug.trim().toLowerCase() : ""
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 80) return NextResponse.json({ error: "Use a valid URL slug (letters, numbers and hyphens)." }, { status: 400 })
    const duplicate = workspace.pages.find(page => page.slug === slug && page.id !== pageInput.id)
    if (duplicate) return NextResponse.json({ error: "That page URL is already in use." }, { status: 409 })
    const rawDraft = pageInput.draft as Record<string, unknown> | undefined
    if (typeof rawDraft?.title !== "string" || !rawDraft.title.trim()) return NextResponse.json({ error: "A page title is required." }, { status: 400 })
    const draft = normalizeStudioPageVersion(pageInput.draft)
    if (!draft.title || draft.sections.length > 40) return NextResponse.json({ error: "A page title and valid sections are required." }, { status: 400 })
    const existing = workspace.pages.find(page => page.id === pageInput.id || page.slug === slug)
    const now = new Date().toISOString()
    if (existing && JSON.stringify(existing.draft) !== JSON.stringify(draft)) {
      const snapshot: StudioPageHistory = { id: randomUUID(), pageId: existing.id, pageTitle: existing.draft.title, createdAt: now, snapshot: existing.draft }
      await writeStudioHistory([snapshot, ...history].slice(0, 100))
    }
    const page: StudioPage = existing ? {
      ...existing, slug, draft, updatedAt: now,
    } : {
      id: randomUUID(), slug, draft, published: null,
      createdAt: now, updatedAt: now, publishedAt: null,
    }
    workspace.pages = existing ? workspace.pages.map(item => item.id === existing.id ? page : item) : [...workspace.pages, page]
    await writeStudioWorkspace(normalizeStudioWorkspace(workspace))
    await audit(actorId, "PAGE_DRAFT_SAVED", page.id, { slug, title: draft.title, sections: draft.sections.length })
    return NextResponse.json({ page, workspace, history: await getStudioPageHistory(), message: "Draft saved. The published page is unchanged until you publish." })
  }

  if (action === "publish-page" || action === "unpublish-page" || action === "delete-page") {
    const pageId = typeof body.pageId === "string" ? body.pageId : ""
    const page = workspace.pages.find(item => item.id === pageId)
    if (!page) return NextResponse.json({ error: "Page not found." }, { status: 404 })
    if (action === "publish-page") {
      if (page.published) {
        const snapshot: StudioPageHistory = { id: randomUUID(), pageId: page.id, pageTitle: page.published.title, createdAt: new Date().toISOString(), snapshot: page.published }
        await writeStudioHistory([{ ...snapshot }, ...history].slice(0, 100))
      }
      page.published = page.draft
      page.publishedAt = new Date().toISOString()
      page.updatedAt = page.publishedAt
      await writeStudioWorkspace(workspace)
      await audit(actorId, "PAGE_PUBLISHED", page.id, { slug: page.slug, title: page.draft.title })
      return NextResponse.json({ workspace, message: "Page published." })
    }
    if (action === "unpublish-page") {
      page.published = null
      page.publishedAt = null
      page.updatedAt = new Date().toISOString()
      await writeStudioWorkspace(workspace)
      await audit(actorId, "PAGE_UNPUBLISHED", page.id, { slug: page.slug })
      return NextResponse.json({ workspace, message: "Page is no longer publicly visible." })
    }
    workspace.pages = workspace.pages.filter(item => item.id !== page.id)
    workspace.navigation = workspace.navigation.filter(item => item.url !== `/pages/${page.slug}`)
    await writeStudioWorkspace(workspace)
    await audit(actorId, "PAGE_DELETED", page.id, { slug: page.slug })
    return NextResponse.json({ workspace, message: "Page removed from Studio." })
  }

  if (action === "save-global") {
    const incoming = body.workspace
    if (!incoming || typeof incoming !== "object") return NextResponse.json({ error: "Workspace settings are required." }, { status: 400 })
    const next = normalizeStudioWorkspace({ ...workspace, ...(incoming as Record<string, unknown>), pages: workspace.pages })
    const sources = new Set(next.redirects.map(rule => rule.from))
    if (sources.size !== next.redirects.length) return NextResponse.json({ error: "Each redirect source must be unique." }, { status: 400 })
    for (const rule of next.redirects) {
      if (rule.to === rule.from || sources.has(rule.to)) return NextResponse.json({ error: "Redirect loops are not allowed. Check the source and destination paths." }, { status: 400 })
    }
    await writeStudioWorkspace(next)
    await audit(actorId, "STUDIO_SETTINGS_SAVED", null, { navigationItems: next.navigation.length, mediaAssets: next.media.length, redirects: next.redirects.length })
    return NextResponse.json({ workspace: next, message: "Studio settings saved." })
  }

  if (action === "restore-page") {
    const versionId = typeof body.versionId === "string" ? body.versionId : ""
    const version = history.find(item => item.id === versionId)
    if (!version) return NextResponse.json({ error: "That revision is no longer available." }, { status: 404 })
    const page = workspace.pages.find(item => item.id === version.pageId)
    if (!page) return NextResponse.json({ error: "The original page no longer exists." }, { status: 404 })
    const now = new Date().toISOString()
    const currentSnapshot: StudioPageHistory = { id: randomUUID(), pageId: page.id, pageTitle: page.draft.title, createdAt: now, snapshot: page.draft }
    await writeStudioHistory([currentSnapshot, ...history].slice(0, 100))
    page.draft = normalizeStudioPageVersion(version.snapshot)
    page.updatedAt = now
    await writeStudioWorkspace(workspace)
    await audit(actorId, "PAGE_REVISION_RESTORED", page.id, { versionId, slug: page.slug })
    return NextResponse.json({ workspace, history: await getStudioPageHistory(), message: "Revision restored to draft. Publish it when ready." })
  }

  return NextResponse.json({ error: "Unsupported Studio action." }, { status: 400 })
}
