import { prisma } from "@/lib/prisma"

export type StudioBlockType = "hero" | "rich-text" | "image" | "image-text" | "button" | "product-grid" | "faq" | "spacer"
export type StudioBlock = {
  id: string
  type: StudioBlockType
  eyebrow: string
  title: string
  body: string
  image: string
  buttonText: string
  buttonUrl: string
  backgroundColor: string
  textColor: string
  align: "left" | "center" | "right"
  productCategory: string
  productCount: number
  items: Array<{ question: string; answer: string }>
}
export type StudioPageVersion = {
  title: string
  seoTitle: string
  seoDescription: string
  canonical: string
  ogImage: string
  noIndex: boolean
  sections: StudioBlock[]
}
export type StudioPage = {
  id: string
  slug: string
  draft: StudioPageVersion
  published: StudioPageVersion | null
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}
export type StudioNavigationItem = { id: string; label: string; url: string; enabled: boolean; sortOrder: number }
export type StudioMediaAsset = { id: string; name: string; url: string; alt: string; folder: string; createdAt: string }
export type StudioRedirect = { id: string; from: string; to: string; status: 301 | 302; enabled: boolean }
export type StudioSiteSEO = { title: string; description: string; keywords: string; canonical: string; ogImage: string; noIndex: boolean }
export type StudioWorkspace = {
  seo: StudioSiteSEO
  pages: StudioPage[]
  navigation: StudioNavigationItem[]
  media: StudioMediaAsset[]
  redirects: StudioRedirect[]
}
export type StudioPageHistory = { id: string; pageId: string; pageTitle: string; createdAt: string; snapshot: StudioPageVersion }

const KEY = "noore_studio_workspace_v1"
const HISTORY_KEY = "noore_studio_page_history_v1"
const BLOCK_TYPES: StudioBlockType[] = ["hero", "rich-text", "image", "image-text", "button", "product-grid", "faq", "spacer"]
const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : ""
const safeUrl = (value: unknown) => {
  const url = clean(value, 2048)
  return (url.startsWith("/") && !url.startsWith("//")) || /^https:\/\//i.test(url) ? url : ""
}
const hex = /^#[0-9a-f]{6}$/i

export function normalizeStudioBlock(input: unknown): StudioBlock {
  const row = input && typeof input === "object" ? input as Record<string, unknown> : {}
  const type = BLOCK_TYPES.includes(row.type as StudioBlockType) ? row.type as StudioBlockType : "rich-text"
  const items = Array.isArray(row.items) ? row.items.slice(0, 20).map(item => {
    const entry = item && typeof item === "object" ? item as Record<string, unknown> : {}
    return { question: clean(entry.question, 240), answer: clean(entry.answer, 1200) }
  }) : []
  const color = (v: unknown, fallback: string) => typeof v === "string" && hex.test(v) ? v : fallback
  return {
    id: /^[a-zA-Z0-9_-]{1,80}$/.test(clean(row.id, 80)) ? clean(row.id, 80) : crypto.randomUUID(),
    type,
    eyebrow: clean(row.eyebrow, 120),
    title: clean(row.title, 240),
    body: clean(row.body, 4000),
    image: safeUrl(row.image),
    buttonText: clean(row.buttonText, 80),
    buttonUrl: safeUrl(row.buttonUrl),
    backgroundColor: color(row.backgroundColor, "#f7f6f2"),
    textColor: color(row.textColor, "#30352e"),
    align: row.align === "center" || row.align === "right" ? row.align : "left",
    productCategory: clean(row.productCategory, 100),
    productCount: Math.min(12, Math.max(1, Number.isFinite(Number(row.productCount)) ? Math.floor(Number(row.productCount)) : 4)),
    items,
  }
}

export function normalizeStudioPageVersion(input: unknown): StudioPageVersion {
  const row = input && typeof input === "object" ? input as Record<string, unknown> : {}
  return {
    title: clean(row.title, 160) || "Untitled page",
    seoTitle: clean(row.seoTitle, 180),
    seoDescription: clean(row.seoDescription, 320),
    canonical: safeUrl(row.canonical),
    ogImage: safeUrl(row.ogImage),
    noIndex: row.noIndex === true,
    sections: Array.isArray(row.sections) ? row.sections.slice(0, 40).map(normalizeStudioBlock) : [],
  }
}

export function normalizeStudioWorkspace(input: unknown): StudioWorkspace {
  const row = input && typeof input === "object" ? input as Record<string, unknown> : {}
  const pages = Array.isArray(row.pages) ? row.pages.slice(0, 100).flatMap((item): StudioPage[] => {
    if (!item || typeof item !== "object") return []
    const page = item as Record<string, unknown>
    const slug = clean(page.slug, 80).toLowerCase()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return []
    return [{
      id: clean(page.id, 80) || crypto.randomUUID(),
      slug,
      draft: normalizeStudioPageVersion(page.draft),
      published: page.published && typeof page.published === "object" ? normalizeStudioPageVersion(page.published) : null,
      createdAt: clean(page.createdAt, 40) || new Date().toISOString(),
      updatedAt: clean(page.updatedAt, 40) || new Date().toISOString(),
      publishedAt: clean(page.publishedAt, 40) || null,
    }]
  }) : []
  const navigation = Array.isArray(row.navigation) ? row.navigation.slice(0, 30).flatMap((item, index): StudioNavigationItem[] => {
    if (!item || typeof item !== "object") return []
    const entry = item as Record<string, unknown>
    const label = clean(entry.label, 60), url = safeUrl(entry.url)
    if (!label || !url) return []
    return [{ id: clean(entry.id, 80) || crypto.randomUUID(), label, url, enabled: entry.enabled !== false, sortOrder: index + 1 }]
  }) : []
  const media = Array.isArray(row.media) ? row.media.slice(0, 300).flatMap(item => {
    if (!item || typeof item !== "object") return []
    const entry = item as Record<string, unknown>
    const name = clean(entry.name, 120), url = safeUrl(entry.url)
    if (!name || !url) return []
    return [{ id: clean(entry.id, 80) || crypto.randomUUID(), name, url, alt: clean(entry.alt, 240), folder: clean(entry.folder, 80) || "General", createdAt: clean(entry.createdAt, 40) || new Date().toISOString() }]
  }) : []
  const redirects = Array.isArray(row.redirects) ? row.redirects.slice(0, 200).flatMap(item => {
    if (!item || typeof item !== "object") return []
    const entry = item as Record<string, unknown>
    const from = clean(entry.from, 180), to = safeUrl(entry.to)
    if (!from.startsWith("/") || from.startsWith("//") || from === to || !to) return []
    return [{ id: clean(entry.id, 80) || crypto.randomUUID(), from, to, status: entry.status === 302 ? 302 as const : 301 as const, enabled: entry.enabled !== false }]
  }) : []
  const seoRow = row.seo && typeof row.seo === "object" ? row.seo as Record<string, unknown> : {}
  const seo: StudioSiteSEO = { title: clean(seoRow.title, 180), description: clean(seoRow.description, 320), keywords: clean(seoRow.keywords, 500), canonical: safeUrl(seoRow.canonical), ogImage: safeUrl(seoRow.ogImage), noIndex: seoRow.noIndex === true }\n  return { seo, pages, navigation, media, redirects }
}

export async function getStudioWorkspace(): Promise<StudioWorkspace> {
  const row = await prisma.setting.findUnique({ where: { key: KEY }, select: { value: true } })
  try { return normalizeStudioWorkspace(row?.value ? JSON.parse(row.value) : {}) } catch { return normalizeStudioWorkspace({}) }
}

export async function getStudioPageHistory(): Promise<StudioPageHistory[]> {
  const row = await prisma.setting.findUnique({ where: { key: HISTORY_KEY }, select: { value: true } })
  try {
    const value = row?.value ? JSON.parse(row.value) : []
    return Array.isArray(value) ? value.slice(0, 100).filter(item => item && typeof item.id === "string" && item.snapshot) : []
  } catch { return [] }
}

export async function writeStudioWorkspace(workspace: StudioWorkspace) {
  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: JSON.stringify(workspace) },
    update: { value: JSON.stringify(workspace) },
  })
}

export async function writeStudioHistory(history: StudioPageHistory[]) {
  await prisma.setting.upsert({
    where: { key: HISTORY_KEY },
    create: { key: HISTORY_KEY, value: JSON.stringify(history.slice(0, 100)) },
    update: { value: JSON.stringify(history.slice(0, 100)) },
  })
}
