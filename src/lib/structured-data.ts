export function productJsonLd({ product, url, siteUrl }: { product: any; url: string; siteUrl: string }) {
  const price = product.salePrice ?? product.price
  const ratingCount = product.reviews?.length || 0
  const approvedReviews = (product.reviews || []).filter((r: any) => r.approved)
  const ratingValue = approvedReviews.length ? approvedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / approvedReviews.length : undefined
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || undefined,
    sku: product.sku,
    category: product.category,
    image: product.images?.map((image: string) => image.startsWith("http") ? image : `${siteUrl}${image}`),
    brand: { "@type": "Brand", name: "NOORÉ" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "PKR",
      price: price.toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(ratingValue && ratingCount ? { aggregateRating: { "@type": "AggregateRating", ratingValue: ratingValue.toFixed(1), reviewCount: approvedReviews.length } } : {}),
  }
}

export function organizationJsonLd(siteUrl: string) {
  return { "@context": "https://schema.org", "@type": "Organization", name: "NOORÉ", url: siteUrl, logo: `${siteUrl}/og-image.jpg` }
}
