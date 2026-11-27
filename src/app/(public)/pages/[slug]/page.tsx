import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getStudioWorkspace } from "@/lib/studio-workspace"
import StudioPageRenderer from "@/components/studio/studio-page-renderer"

export const dynamic = "force-dynamic"
export const revalidate = 0

type Props = { params: Promise<{ slug: string }> }

async function getPublishedPage(slug: string) {
  const workspace = await getStudioWorkspace()
  return workspace.pages.find(page => page.slug === slug && page.published) || null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page?.published) return { title: "Page not found", robots: { index: false, follow: false } }
  const version = page.published
  const title = version.seoTitle || version.title
  const description = version.seoDescription || undefined
  const canonical = version.canonical || `/pages/${page.slug}`
  return {
    title,
    description,
    alternates: { canonical },
    robots: version.noIndex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      ...(version.ogImage ? { images: [{ url: version.ogImage, alt: version.title }] } : {}),
    },
    twitter: {
      card: version.ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(version.ogImage ? { images: [version.ogImage] } : {}),
    },
  }
}

export default async function CustomStorefrontPage({ params }: Props) {
  const { slug } = await params
  const page = await getPublishedPage(slug)
  if (!page?.published) notFound()
  return <StudioPageRenderer page={page.published} />
}
