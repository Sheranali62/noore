export const dynamic = "force-dynamic"
export const revalidate = 0

import { prisma } from "@/lib/prisma"

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  // Static pages
  const staticPages = [
    "",
    "/products",
    "/about",
    "/contact",
    "/blog",
    "/size-guide",
    "/store-locator",
    "/faq",
    "/shipping-policy",
    "/return-policy",
    "/privacy-policy",
    "/terms",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: path === "" ? 1 : 0.8,
  }))

  // Blog posts
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
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }))

  // Product pages
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
    url: `${baseUrl}/product/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [...staticPages, ...blogPages, ...productPages]
}