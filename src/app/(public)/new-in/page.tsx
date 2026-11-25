import { prisma } from "@/lib/prisma"
import { EditorialLanding } from "@/components/home/editorial-landing"
export const dynamic = "force-dynamic"
export default async function NewInPage() {
  const rows = await prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 16, select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true, category: true, stock: true, gender: true, variants: { select: { color: true }, distinct: ["color"] } } })
  return <EditorialLanding eyebrow="NOORÉ / New In" title="The latest, just arrived." description="Discover the newest pieces added to the NOORÉ wardrobe, from quiet everyday essentials to statement edits." image="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=2200&auto=format&fit=crop" href="/products" secondaryTitle="Just landed" products={rows.map(p => ({...p, colors: p.variants.map(v => v.color)}))} />
}
