import Link from "next/link"
import { ProductCard } from "@/components/product/product-card"

export type LandingProduct = {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  category: string
  stock: number
  gender: string | null
  colors: string[]
}

export function EditorialLanding({
  eyebrow,
  title,
  description,
  image,
  cta = "Shop the edit",
  href = "/products",
  products,
  secondaryTitle,
}: {
  eyebrow: string
  title: string
  description: string
  image: string
  cta?: string
  href?: string
  products: LandingProduct[]
  secondaryTitle?: string
}) {
  return (
    <main className="bg-cream text-charcoal">
      <section className="relative min-h-[58vh] overflow-hidden bg-charcoal text-white md:min-h-[68vh]">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
        <div className="relative mx-auto flex min-h-[58vh] max-w-7xl items-end px-5 py-16 md:min-h-[68vh] md:px-8 md:py-20">
          <div className="max-w-2xl">
            <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-white/70">{eyebrow}</p>
            <h1 className="mt-4 font-editorial text-5xl leading-[0.95] md:text-7xl">{title}</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/80 md:text-base">{description}</p>
            <Link href={href} className="mt-8 inline-flex bg-white px-7 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-charcoal">{cta}</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-secondary">NOORÉ / Curated</p>
            <h2 className="mt-2 font-editorial text-3xl md:text-4xl">{secondaryTitle || "The edit"}</h2>
          </div>
          <Link href={href} className="hidden text-[9px] font-semibold uppercase tracking-[0.16em] underline underline-offset-4 md:block">View all</Link>
        </div>
        {products.length ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6 md:gap-y-14">
            {products.map((product) => <ProductCard key={product.id} {...product} image={product.images[0] || "/placeholder.jpg"} hoverImage={product.images[1]} />)}
          </div>
        ) : (
          <div className="border border-border px-6 py-20 text-center"><h3 className="font-editorial text-3xl">Coming soon.</h3><p className="mt-2 text-sm text-secondary">This edit will appear here as products are added.</p></div>
        )}
      </section>
    </main>
  )
}
