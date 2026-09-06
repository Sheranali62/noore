import { prisma } from "@/lib/prisma"
import { DepartmentCategories } from "@/components/home/department-categories"
import { EditorialLanding } from "@/components/home/editorial-landing"

export const dynamic = "force-dynamic"

const categories = [
  ["Shalwar Kameez", "Classic Pakistani dressing for everyday and festive wear."],
  ["Kurta", "Versatile kurtas from relaxed to refined."],
  ["2 Piece", "Coordinated looks for effortless dressing."],
  ["3 Piece", "Complete layered looks for special occasions."],
  ["Waistcoats", "The finishing layer for traditional occasionwear."],
  ["Prince Coats", "Structured formal silhouettes for celebrations."],
  ["Suits", "Sharp tailoring for formal settings."],
  ["Formal Wear", "Elevated looks for weddings and important occasions."],
  ["Casual Wear", "Comfortable everyday menswear."],
  ["Unstitched", "Fabric-led dressing for a personal finish."],
  ["Kameez", "Traditional upper silhouettes in considered fabrics."],
  ["Shalwar", "Classic bottoms designed to pair with your edit."],
  ["Trousers", "Modern separates for work and everyday wear."],
  ["Jackets", "Contemporary layers for cooler days and evenings."],
  ["Festive Wear", "Polished looks for Eid, weddings and celebrations."],
  ["New Arrivals", "The newest pieces added to the men’s edit."],
  ["Sale", "Selected styles at a special price."]
] as const


const categoryImages = ["https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1610652492500-ded49ceeb378?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1555069519-127aadedf1ee?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1598808503746-f34c53b9323e?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1520975682031-ae6c0f4d2f7a?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=1200&auto=format&fit=crop"]

export default async function MenPage() {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", gender: { in: ["Men", "MEN", "men"] } },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { variants: { select: { color: true }, distinct: ["color"] } }
  })

  return (
    <>
      <DepartmentCategories
        eyebrow="NOORÉ / Men"
        title="The complete modern Pakistani menswear edit."
        description="Shop shalwar kameez, kurtas, 2-piece and 3-piece looks, waistcoats, prince coats, tailoring and everyday essentials."
        categories={categories.map(([name, description], index) => ({
          name,
          description,
          image: categoryImages[index],
          href: name === "New Arrivals"
            ? "/products?gender=Men&sort=newest"
            : name === "Sale"
              ? "/products?gender=Men&sale=true"
              : `/products?gender=Men&category=${encodeURIComponent(name)}`
        }))}
      />
      <EditorialLanding
        eyebrow="NOORÉ / Men"
        title="Refined dressing, without the noise."
        description="Clean silhouettes, considered fabrics and timeless Pakistani menswear for every setting."
        image="https://images.unsplash.com/photo-1617137968427-85924c800a22?w=2200&auto=format&fit=crop"
        href="/products?gender=Men"
        products={rows.map(p => ({ ...p, colors: p.variants.map(v => v.color) }))}
      />
    </>
  )
}
