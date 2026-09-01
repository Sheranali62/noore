import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/product/product-detail"

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
  })

  if (!product) notFound()

  // Get related products (same category)
  const relatedProducts = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      category: product.category,
      id: { not: product.id },
    },
    take: 4,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <ProductDetail product={product} relatedProducts={relatedProducts} />
    </div>
  )
}