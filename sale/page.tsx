import { prisma } from "@/lib/prisma"
import { EditorialLanding } from "@/components/home/editorial-landing"
export const dynamic = "force-dynamic"
export default async function SalePage() {
  const rows = await prisma.product.findMany({ where: { status: "ACTIVE", salePrice: { not: null } }, orderBy: { createdAt: "desc" }, take: 16, include: { variants: { select: { color: true }, distinct: ["color"] } } })
  return <EditorialLanding eyebrow="NOORÉ / Sale" title="Beautiful pieces, considered prices." description="A curated selection of signature NOORÉ styles, now available at special prices." image="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=2200&auto=format&fit=crop" href="/products?sale=1" secondaryTitle="The sale edit" products={rows.map(p => ({...p, colors: p.variants.map(v => v.color)}))} />
}
