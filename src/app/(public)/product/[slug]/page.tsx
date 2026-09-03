import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductDetail } from "@/components/product/product-detail"
import { productJsonLd } from "@/lib/structured-data"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}) {
  const product = await prisma.product.findUnique({
    where: { slug: params.slug },
    select: {
      name: true,
      description: true,
      seoTitle: true,
      seoDesc: true,
      images: true,
    },
  })

  if (!product) {
    return {
      title: "Product | NOORÉ",
    }
  }

  return {
    title: product.seoTitle || `${product.name} | NOORÉ`,
    description:
      product.seoDesc ||
      product.description ||
      `Shop ${product.name} from NOORÉ.`,
    alternates: {
      canonical: `/product/${params.slug}`,
    },
    openGraph: {
      title: product.seoTitle || product.name,
      description:
        product.seoDesc || product.description || undefined,
      images: product.images[0]
        ? [product.images[0]]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle || product.name,
      description:
        product.seoDesc ||
        product.description ||
        `Shop ${product.name} from NOORÉ.`,
      images: product.images[0]
        ? [product.images[0]]
        : undefined,
    },
  }
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const product = await prisma.product.findUnique({
    where: {
      slug: params.slug,
    },
    include: {
      variants: true,
      reviews: {
        where: {
          approved: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 12,
        select: {
          id: true,
          rating: true,
          comment: true,
          verified: true,
          createdAt: true,
        },
      },
    },
  })

  if (!product || product.status !== "ACTIVE") {
    notFound()
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      category: product.category,
      id: {
        not: product.id,
      },
    },
    take: 4,
    orderBy: {
      createdAt: "desc",
    },
  })

  const jsonLd = productJsonLd({
    product,
    url: `/product/${product.slug}`,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://noore.vercel.app",
  })

  /*
   * ProductDetail expects review.createdAt to be a string.
   * Convert Date -> ISO string before passing the object.
   */
  const productForDetail = {
    ...product,
    reviews: product.reviews.map((review) => ({
      ...review,
      createdAt: review.createdAt.toISOString(),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <ProductDetail
          product={productForDetail}
          relatedProducts={relatedProducts}
        />
      </div>
    </>
  )
}