import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { ProductCard } from "@/components/product/product-card"
import type { StudioBlock, StudioPageVersion } from "@/lib/studio-workspace"

function safeStyle(color: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback
}

export default async function StudioPageRenderer({ page }: { page: StudioPageVersion }) {
  const needsProducts = page.sections.some(block => block.type === "product-grid")
  const products = needsProducts ? await prisma.product.findMany({
    where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 200,
    select: { id: true, name: true, slug: true, price: true, salePrice: true, images: true, category: true, stock: true, gender: true },
  }) : []
  return <main className="min-h-screen bg-[#f7f6f2] text-[#30352e]">
    {page.sections.map(block => <StudioSection key={block.id} block={block} products={products} />)}
  </main>
}

function StudioSection({ block, products }: { block: StudioBlock; products: Array<{ id: string; name: string; slug: string; price: number; salePrice: number | null; images: string[]; category: string; stock: number; gender: string | null }> }) {
  const style = { backgroundColor: safeStyle(block.backgroundColor, "#f7f6f2"), color: safeStyle(block.textColor, "#30352e") }
  const align = block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"
async function StudioSection({ block }: { block: StudioBlock }) {
  const style = { backgroundColor: safeStyle(block.backgroundColor, "#f7f6f2"), color: safeStyle(block.textColor, "#30352e") }
  const align = block.align === "center" ? "text-center" : block.align === "right" ? "text-right" : "text-left"
  if (block.type === "spacer") return <div aria-hidden="true" className="h-12 md:h-24" />
  if (block.type === "product-grid") {
    const matchingProducts = products.filter(product => !block.productCategory || product.category.toLowerCase() === block.productCategory.toLowerCase()).slice(0, block.productCount)
    return <section style={style} className="px-5 py-14 md:px-8 md:py-20"><div className="mx-auto max-w-7xl">
      {block.eyebrow && <p className={`text-[10px] font-semibold uppercase tracking-[.25em] opacity-60 ${align}`}>{block.eyebrow}</p>}
      {block.title && <h2 className={`mt-3 font-editorial text-3xl md:text-5xl ${align}`}>{block.title}</h2>}
      {matchingProducts.length ? <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{matchingProducts.map(product => <ProductCard key={product.id} id={product.id} name={product.name} slug={product.slug} price={product.price} salePrice={product.salePrice} image={product.images[0] || "/placeholder.jpg"} category={product.category} stock={product.stock} gender={product.gender} />)}</div> : <p className="mt-6 text-sm opacity-60">New pieces are coming soon.</p>}
    </div></section>
  }
  if (block.type === "faq") return <section style={style} className="px-5 py-14 md:px-8 md:py-20"><div className="mx-auto max-w-4xl">
    {block.eyebrow && <p className={`text-[10px] font-semibold uppercase tracking-[.25em] opacity-60 ${align}`}>{block.eyebrow}</p>}
    {block.title && <h2 className={`mt-3 font-editorial text-3xl md:text-5xl ${align}`}>{block.title}</h2>}
    <div className="mt-8 divide-y divide-current/15">{block.items.map((item, index) => <details key={index} className="py-5"><summary className="cursor-pointer text-sm font-semibold">{item.question}</summary><p className="mt-3 whitespace-pre-line text-sm leading-7 opacity-70">{item.answer}</p></details>)}</div>
  </div></section>
  if (block.type === "image") return <section style={style} className="px-5 py-10 md:px-8 md:py-16"><div className="mx-auto max-w-7xl">{block.image && <img src={block.image} alt={block.imageAlt || block.title || ""} className="max-h-[760px] w-full object-cover" />}{block.title && <h2 className="mt-5 font-editorial text-3xl">{block.title}</h2>}</div></section>
  if (block.type === "image-text") return <section style={style} className="px-5 py-12 md:px-8 md:py-20"><div className="mx-auto grid max-w-7xl items-center gap-8 md:grid-cols-2 md:gap-14">{block.image && <img src={block.image} alt={block.imageAlt || block.title || ""} className="max-h-[680px] w-full object-cover" />}<div className={align}>{block.eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[.25em] opacity-60">{block.eyebrow}</p>}{block.title && <h2 className="mt-3 font-editorial text-3xl leading-tight md:text-5xl">{block.title}</h2>}{block.body && <p className="mt-5 whitespace-pre-line text-sm leading-7 opacity-75">{block.body}</p>}{block.buttonText && block.buttonUrl && <Link href={block.buttonUrl} className="mt-7 inline-flex bg-[#535f4c] px-7 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white">{block.buttonText}</Link>}</div></div></section>
  if (block.type === "button") return <section style={style} className={`px-5 py-10 md:px-8 ${align}`}>{block.body && <p className="mx-auto mb-4 max-w-2xl text-sm leading-7 opacity-70">{block.body}</p>}{block.buttonText && block.buttonUrl && <Link href={block.buttonUrl} className="inline-flex bg-[#535f4c] px-8 py-4 text-[10px] font-semibold uppercase tracking-[.18em] text-white">{block.buttonText}</Link>}</section>
  const hero = block.type === "hero"
  return <section style={style} className={`relative overflow-hidden px-5 py-16 md:px-8 md:py-28 ${align}`}>
    {hero && block.image && <><img src={block.image} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-black/35" /></>}
    <div className={`relative mx-auto max-w-5xl ${hero ? "py-12 text-white md:py-20" : ""}`}>
      {block.eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[.28em] opacity-65">{block.eyebrow}</p>}
      {block.title && (hero ? <h1 className="mt-4 font-editorial text-4xl leading-[1.05] md:text-7xl">{block.title}</h1> : <h2 className="mt-4 font-editorial text-3xl leading-[1.1] md:text-5xl">{block.title}</h2>)}
      {block.body && <p className="mx-auto mt-5 max-w-3xl whitespace-pre-line text-sm leading-7 opacity-75">{block.body}</p>}
      {block.buttonText && block.buttonUrl && <Link href={block.buttonUrl} className="mt-8 inline-flex bg-[#535f4c] px-8 py-4 text-[10px] font-semibold uppercase tracking-[.18em] text-white">{block.buttonText}</Link>}
    </div>
  </section>
}
