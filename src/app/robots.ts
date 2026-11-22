import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://noore-nine.vercel.app"

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/login/",
        "/register/",
        "/account/",
        "/checkout/",
        "/cart/",
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
