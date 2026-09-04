import { prisma } from "@/lib/prisma"
import { EditorialLanding } from "@/components/home/editorial-landing"
export const dynamic = "force-dynamic"
export default async function KidsPage() {
  const rows = await prisma.product.findMany({ where: { status: "ACTIVE", gender: { in: ["Kids", "KIDS", "kids", "Children"] } }, orderBy: { createdAt: "desc" }, take: 12, include: { variants: { select: { color: true }, distinct: ["color"] } } })
  return <EditorialLanding eyebrow="NOORÉ / Kids" title="Little looks, beautifully made." description="Playful occasionwear and everyday pieces designed for comfort, movement and memorable moments." image="https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=2200&auto=format&fit=crop" href="/products?gender=Kids" products={rows.map(p => ({...p, colors: p.variants.map(v => v.color)}))} />
}
