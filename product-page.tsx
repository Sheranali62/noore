import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { ProductDetail } from "@/components/product/product-detail"
import { productJsonLd } from "@/lib/structured-data"

export const revalidate = 300

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await prisma.product.findUnique({ where: { slug: params.slug }, select: { name: true, description: true, images: true, seoTitle: true, seoDesc: true, slug: true } })
  if (!product) return { title: "Product Not Found | NOORÉ" }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const title = product.seoTitle || `${product.name} | NOORÉ`
  const description = product.seoDesc || product.description || `Shop ${product.name} from NOORÉ.`
  const image = product.images?.[0]
  return { title, description, alternates: { canonical: `${siteUrl}/product/${product.slug}` }, openGraph: { title, description, url: `${siteUrl}/product/${product.slug}`, siteName: "NOORÉ", type: "website", ...(image ? { images: [{ url: image.startsWith("http") ? image : `${siteUrl}${image}` }] } : {}) }, twitter: { card: "summary_large_image", title, description } }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug }, include: { variants: true, reviews: { where: { approved: true }, select: { rating: true } } } })
  if (!product) notFound()
  const relatedProducts = await prisma.product.findMany({ where: { status: "ACTIVE", category: product.category, id: { not: product.id } }, take: 4, orderBy: { createdAt: "desc" } })
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  const jsonLd = productJsonLd({ product, url: `${siteUrl}/product/${product.slug}`, siteUrl })
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="max-w-7xl mx-auto px-4 py-8"><ProductDetail product={product} relatedProducts={relatedProducts} /></div>
  </>
}
