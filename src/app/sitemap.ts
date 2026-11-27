export const dynamic = "force-dynamic"
export const revalidate = 0

import { prisma } from "@/lib/prisma"
import { getStudioWorkspace } from "@/lib/studio-workspace"

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://noore-nine.vercel.app").replace(/\/$/, "")

export default async function sitemap() {
  const staticPages = [
    "",
    "/products",
    "/new-in",
    "/sale",
    "/women",
    "/men",
    "/kids",
    "/collections",
    "/about",
    "/contact",
    "/blog",
    "/journal",
    "/shipping",
    "/returns",
    "/privacy",
    "/terms",
    ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }))

  let posts: { slug: string; updatedAt: Date }[] = []
  try {
    posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
  } catch (error) {
    console.error("Sitemap blog query failed:", error)
  }

  const blogPages = posts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  let products: { slug: string; updatedAt: Date }[] = []
  try {
    products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    })
  } catch (error) {
    console.error("Sitemap product query failed:", error)
  }

  const productPages = products.map((product) => ({
    url: `${SITE_URL}/product/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  const studioPages = (await getStudioWorkspace()).pages.flatMap((page) => page.published && !page.published.noIndex ? [{\n    url: `${SITE_URL}/pages/${page.slug}`,\n    lastModified: new Date(page.publishedAt || page.updatedAt),\n    changeFrequency: "weekly" as const,\n    priority: 0.6,\n  }] : [])\n\n  return [...staticPages, ...blogPages, ...productPages, ...studioPages]
}
