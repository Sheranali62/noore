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
        categories={categories.map(([name, description]) => ({
          name,
          description,
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
