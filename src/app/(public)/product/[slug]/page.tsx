import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/product/product-detail"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({ where: { slug: params.slug }, select: { name: true, description: true, seoTitle: true, seoDesc: true, images: true } })
  if (!product) return { title: "Product | NOORÉ" }
  return {
    title: product.seoTitle || `${product.name} | NOORÉ`,
    description: product.seoDesc || product.description || `Shop ${product.name} from NOORÉ.`,
    openGraph: { title: product.seoTitle || product.name, description: product.seoDesc || product.description || undefined, images: product.images[0] ? [product.images[0]] : undefined },
  }
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    include: { variants: true, reviews: { where: { approved: true }, orderBy: { createdAt: "desc" }, take: 12, select: { id: true, rating: true, comment: true, verified: true, createdAt: true } } },
  })

  if (!product || product.status !== "ACTIVE") notFound()

  const relatedProducts = await prisma.product.findMany({
    where: { status: "ACTIVE", category: product.category, id: { not: product.id } },
    take: 4,
    orderBy: { createdAt: "desc" },
  })

  const serializedProduct = { ...product, reviews: product.reviews.map(review => ({ ...review, createdAt: review.createdAt.toISOString() })) }

  return <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8"><ProductDetail product={serializedProduct} relatedProducts={relatedProducts} /></div>
}
