import { prisma } from "@/lib/prisma"
import { EditorialLanding } from "@/components/home/editorial-landing"
export const dynamic = "force-dynamic"
export default async function NewInPage() {
  const rows = await prisma.product.findMany({ where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 16, include: { variants: { select: { color: true }, distinct: ["color"] } } })
  return <EditorialLanding eyebrow="NOORÉ / New In" title="The latest, just arrived." description="Discover the newest pieces added to the NOORÉ wardrobe, from quiet everyday essentials to statement edits." image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=2200&auto=format&fit=crop" href="/products" secondaryTitle="Just landed" products={rows.map(p => ({...p, colors: p.variants.map(v => v.color)}))} />
}
