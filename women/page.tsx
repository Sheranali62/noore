import { prisma } from "@/lib/prisma"
import { EditorialLanding } from "@/components/home/editorial-landing"
export const dynamic = "force-dynamic"
export default async function WomenPage() {
  const rows = await prisma.product.findMany({ where: { status: "ACTIVE", gender: { in: ["Women", "WOMEN", "women"] } }, orderBy: { createdAt: "desc" }, take: 12, include: { variants: { select: { color: true }, distinct: ["color"] } } })
  return <EditorialLanding eyebrow="NOORÉ / Women" title="For her, beautifully considered." description="Modern Pakistani dressing across everyday silhouettes, occasionwear and elevated essentials." image="https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=2200&auto=format&fit=crop" href="/products?gender=Women" products={rows.map(p => ({...p, colors: p.variants.map(v => v.color)}))} />
}
