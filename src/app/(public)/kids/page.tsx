import { prisma } from "@/lib/prisma"
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

export default async function KidsPage() {
  const rows = await prisma.product.findMany({
    where: { status: "ACTIVE", gender: { in: ["Kids", "KIDS", "kids", "Children"] } },
    orderBy: { createdAt: "desc" },
    take: 12,
    include: { variants: { select: { color: true }, distinct: ["color"] } }
  })

  return (
    <>
      <DepartmentCategories
        eyebrow="NOORÉ / Kids"
        title="Little wardrobes, complete from everyday to festive."
        description="Browse separate girls’ and boys’ edits across shalwar kameez, 2-piece and 3-piece looks, kurtas, waistcoats, casualwear and festive dressing."
        categories={categories.map(([name, description]) => ({
          name,
          description,
          href: name === "New Arrivals"
            ? "/products?gender=Kids&sort=newest"
            : name === "Sale"
              ? "/products?gender=Kids&sale=true"
              : `/products?gender=Kids&category=${encodeURIComponent(name)}`
        }))}
      />
      <EditorialLanding
        eyebrow="NOORÉ / Kids"
        title="Little looks, beautifully made."
        description="Playful occasionwear and everyday pieces designed for comfort, movement and memorable moments."
        image="https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=2200&auto=format&fit=crop"
        href="/products?gender=Kids"
        products={rows.map(p => ({ ...p, colors: p.variants.map(v => v.color) }))}
      />
    </>
  )
}
