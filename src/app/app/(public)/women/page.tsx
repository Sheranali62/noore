import { prisma } from "@/lib/prisma"
import { DepartmentCategories } from "@/components/home/department-categories"
import { EditorialLanding } from "@/components/home/editorial-landing"

export const dynamic = "force-dynamic"

const categories = [
  ["Saree", "Draped occasionwear and timeless silhouettes."],
  ["Shalwar Kameez", "The signature Pakistani wardrobe essential."],
  ["2 Piece", "Polished shirt-and-trouser sets for every day."],
  ["3 Piece", "Complete looks with coordinated dupattas."],
  ["Kurta", "Easy statement kurtas from day to evening."],
  ["Kurtis", "Versatile everyday and smart-casual separates."],
  ["Suits", "Tailored and flowing sets for a refined look."],
  ["Lawn", "Lightweight seasonal dressing for warm days."],
  ["Chiffon", "Fluid fabrics for festive and formal moments."],
  ["Linen", "Textured, breathable dressing with quiet luxury."],
  ["Cambric", "Structured seasonal essentials."],
  ["Formal Wear", "Elevated looks for weddings and celebrations."],
  ["Party Wear", "Statement dressing for evenings and occasions."],
  ["Casual Wear", "Effortless everyday pieces."],
  ["Pret", "Ready-to-wear styles with an easy finish."],
  ["Unstitched", "Build your own look from fabric to finish."],
  ["Dupattas", "Finishing layers to complete the outfit."],
  ["Shawls", "Elegant layers for cooler days and evenings."],
  ["Bottoms", "Trousers and separates to complete your edit."],
  ["New Arrivals", "The newest pieces added to the women’s edit."],
  ["Sale", "Selected styles at a special price."]
] as const


const categoryImages = ["https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1506629905607-d9f3d6b1f2f0?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1550614000-4b95d4662c3b?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1583846783214-7229a91b20ed?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1623609163859-ca93c959b98a?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=1200&auto=format&fit=crop", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&auto=format&fit=crop"]

export default async function WomenPage() {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", gender: { in: ["Women", "WOMEN", "women"] } },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { variants: { select: { color: true }, distinct: ["color"] } }
  })

  return (
    <>
      <DepartmentCategories
        eyebrow="NOORÉ / Women"
        title="Every expression of Pakistani womenswear."
        description="Explore the complete women’s wardrobe, from everyday lawn and pret to shalwar kameez, sarees, 2-piece and 3-piece sets, and occasion dressing."
        categories={categories.map(([name, description], index) => ({
          name,
          description,
          image: categoryImages[index],
          href: name === "New Arrivals"
            ? "/products?gender=Women&sort=newest"
            : name === "Sale"
              ? "/products?gender=Women&sale=true"
              : `/products?gender=Women&category=${encodeURIComponent(name)}`
        }))}
      />
      <EditorialLanding
        eyebrow="NOORÉ / Women"
        title="For her, beautifully considered."
        description="Modern Pakistani dressing across everyday silhouettes, occasionwear and elevated essentials."
        image="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=2200&auto=format&fit=crop"
        href="/products?gender=Women"
        products={rows.map(p => ({ ...p, colors: p.variants.map(v => v.color) }))}
      />
    </>
  )
}
