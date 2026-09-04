import type { Metadata } from "next"
import { Inter, Playfair_Display } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"
import { Toaster } from "@/components/ui/toaster"
import { GoogleAnalytics } from "@/components/analytics/google-analytics"
import { AutoDayNightTheme } from "@/components/theme/auto-day-night"

const inter = Inter({ 
  subsets: ["latin"], 
  variable: "--font-sans",
  display: "swap",
})

const playfair = Playfair_Display({ 
  subsets: ["latin"], 
  variable: "--font-editorial",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "NOORÉ — Premium Pakistani Fashion",
    template: "%s | NOORÉ",
  },
  description: "Timeless silhouettes rooted in Pakistani craft. Luxury pret, unstitched, men's wear, accessories. Premium fashion for the modern wardrobe.",
  keywords: "pakistani fashion, luxury clothing, women's wear, men's wear, accessories, unstitched fabric, ready to wear, noore",
  authors: [{ name: "NOORÉ" }],
  creator: "NOORÉ",
  publisher: "NOORÉ",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "NOORÉ — Premium Pakistani Fashion",
    description: "Timeless silhouettes rooted in Pakistani craft. Luxury pret, unstitched, men's wear, accessories.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: "NOORÉ",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "NOORÉ — Premium Pakistani Fashion",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NOORÉ — Premium Pakistani Fashion",
    description: "Timeless silhouettes rooted in Pakistani craft. Luxury pret, unstitched, men's wear, accessories.",
    images: ["/og-image.jpg"],
    creator: "@noore",
    site: "@noore",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png" },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
    yandex: process.env.YANDEX_VERIFICATION || "",
  },
  category: "fashion",
  alternates: { canonical: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000" },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <meta name="theme-color" content="#FAF9F6" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var h=new Date().getHours();var dark=h<7||h>=19;var r=document.documentElement;r.classList.toggle("dark",dark);r.setAttribute("data-noore-theme",dark?"night":"day");r.style.colorScheme=dark?"dark":"light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",dark?"#11100F":"#FAF9F6")}catch(e){}})()`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <a href="#main-content" className="skip-link">Skip to content</a>
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && <GoogleAnalytics />}
        
        <Providers>
          <AutoDayNightTheme />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}