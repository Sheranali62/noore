import { prisma } from "@/lib/prisma"
import { getStorefrontMedia, mediaImage } from "@/lib/storefront-media"
import { getCategoryImage } from "@/lib/category-images"
import { getPageContent } from "@/lib/site-page-content"
import { DepartmentCategories } from "@/components/home/department-categories"
import { EditorialLanding } from "@/components/home/editorial-landing"

export const dynamic = "force-dynamic"

const categories = [
  ["Girls Shalwar Kameez", "Traditional looks made playful for little girls."],
  ["Girls 2 Piece", "Easy coordinated sets for everyday dressing."],
  ["Girls 3 Piece", "Complete festive looks with matching layers."],
  ["Girls Kurtis", "Comfortable, versatile girls’ separates."],
  ["Girls Festive Wear", "Special outfits for Eid, weddings and celebrations."],
  ["Boys Shalwar Kameez", "Classic traditional looks for young boys."],
  ["Boys Kurta", "Easy kurtas for everyday and festive occasions."],
  ["Boys Waistcoats", "Smart finishing layers for celebrations."],
  ["Boys 2 Piece", "Coordinated sets for polished occasions."],
  ["Girls Casual", "Comfort-first everyday pieces."],
  ["Boys Casual", "Easy everyday looks for active days."],
  ["Formal", "Dressed-up styles for special moments."],
  ["Festive", "Celebration-ready looks for Eid and family occasions."],
  ["New Arrivals", "The newest pieces added to the kids’ edit."],
  ["Sale", "Selected kids’ styles at a special price."]
] as const


const categoryImages = ["https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1544717305-2782549b5136?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1602030028438-4b1e7c4d2d0d?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1602030028438-4b1e7c4d2d0d?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1504159506876-f8338247a14a?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?w=1200&auto=format&fit=crop"]

export default async function KidsPage() {
  const [rows, imageProducts, media, pageContent] = await Promise.all([
    prisma.product.findMany({
      where: { status: "ACTIVE", gender: { in: ["Kids", "KIDS", "kids", "Children"] } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true, category: true, stock: true, gender: true, variants: { select: { color: true }, distinct: ["color"] } }
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE", gender: { in: ["Kids", "KIDS", "kids", "Children"] } },
      orderBy: { createdAt: "desc" },
      take: 250,
      select: { category: true, subcategory: true, images: true }
    }),
    getStorefrontMedia(),
    getPageContent(),
  ])

  return (
    <>
      <DepartmentCategories
        eyebrow={pageContent.kids.eyebrow}
        title={pageContent.kids.title}
        description={pageContent.kids.description}
        categories={categories.map(([name, description], index) => ({
          name,
          description,
          image: mediaImage(media, "page:kids:category:" + name, getCategoryImage(name, imageProducts, categoryImages[index])),
          href: name === "New Arrivals"
            ? "/products?gender=Kids&sort=newest"
            : name === "Sale"
              ? "/products?gender=Kids&sale=1"
              : `/products?gender=Kids&category=${encodeURIComponent(name)}`
        }))}
      />
      <EditorialLanding
        eyebrow={pageContent.kids.eyebrow}
        title={pageContent.kids.secondaryTitle}
        description={pageContent.kids.secondaryDescription}
        image={mediaImage(media, "page:kids:hero", "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=2200&auto=format&fit=crop")}
        href={pageContent.kids.buttonUrl}
        cta={pageContent.kids.buttonText}
        products={rows.map(p => ({ ...p, colors: p.variants.map(v => v.color) }))}
      />
    </>
  )
}
