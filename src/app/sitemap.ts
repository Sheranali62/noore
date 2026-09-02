import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://noore-b9cwhu0vp-sheranali62.vercel.app"

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

  // Blog posts – with error handling and proper types
  let blogPages: any[] = []
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    })
    blogPages = posts.map((post: { slug: string; updatedAt: Date }) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  } catch (error) {
    console.warn("Sitemap: Could not fetch blog posts:", error)
  }

  // Product pages – with error handling and proper types
  let productPages: any[] = []
  try {
    const products = await prisma.product.findMany({
      where: { status: "ACTIVE" },
      select: { slug: true, updatedAt: true },
    })
    productPages = products.map((product: { slug: string; updatedAt: Date }) => ({
      url: `${baseUrl}/product/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  } catch (error) {
    console.warn("Sitemap: Could not fetch products:", error)
  }

  return [...staticPages, ...blogPages, ...productPages]
}