export type SEOProps = {
  title: string
  description: string
  keywords?: string
  image?: string
  url?: string
  type?: "website" | "article" | "product"
  publishedTime?: string
  author?: string
}

export function generateSEO({
  title,
  description,
  keywords,
  image = "/og-image.jpg",
  url,
  type = "website",
  publishedTime,
  author,
}: SEOProps) {
  const siteName = "NOORÉ — Premium Pakistani Fashion"
  const fullTitle = `${title} | ${siteName}`
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

  return {
    title: fullTitle,
    description,
    keywords: keywords || "pakistani fashion, luxury clothing, women's wear, men's wear, accessories",
    openGraph: {
      title: fullTitle,
      description,
      url: url || siteUrl,
      siteName,
      images: [
        {
          url: image?.startsWith("http") ? image : `${siteUrl}${image}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type,
      ...(publishedTime && { publishedTime }),
      ...(author && { author }),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image?.startsWith("http") ? image : `${siteUrl}${image}`],
    },
    alternates: {
      canonical: url || siteUrl,
    },
  }
}