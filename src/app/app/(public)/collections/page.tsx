import Link from "next/link"

const collections = [
  ["Luxury", "Elevated silhouettes for evenings, occasions and timeless dressing.", "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1800&auto=format&fit=crop", "/products?category=Luxury"],
  ["Festive", "Rich textures and expressive dressing for Eid, celebrations and gatherings.", "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=1800&auto=format&fit=crop", "/products?collection=Festive%202026"],
  ["Wedding Guest", "Polished looks made for mehndi, baraat, walima and every invitation.", "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1800&auto=format&fit=crop", "/products?category=Formal"],
  ["Bridal & Occasion", "Statement dressing for the moments that deserve something unforgettable.", "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1800&auto=format&fit=crop", "/products?category=Luxury"],
  ["Lawn & Summer", "Lightweight seasonal dressing for bright days and easy elegance.", "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1800&auto=format&fit=crop", "/products?collection=Lawn"],
  ["Winter Edit", "Layered textures, deeper tones and refined cold-weather essentials.", "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=1800&auto=format&fit=crop", "/products?collection=Winter"],
  ["Everyday", "Effortless pieces designed for the rhythm of everyday life.", "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1800&auto=format&fit=crop", "/products?category=Casual"],
  ["New Season", "Fresh silhouettes and considered pieces from the latest NOORÉ edit.", "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&auto=format&fit=crop", "/products?sort=newest"],
  ["Best Sellers", "The pieces our customers keep coming back to.", "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1800&auto=format&fit=crop", "/products?sort=popular"],
  ["Sale Edit", "Exceptional pieces, thoughtfully reduced for a limited time.", "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1800&auto=format&fit=crop", "/products?sale=true"],
]

const departments = [
  ["Women", "Sarees, shalwar kameez, 2-piece, 3-piece, pret and occasionwear.", "/women"],
  ["Men", "Shalwar kameez, kurtas, waistcoats, suits and everyday essentials.", "/men"],
  ["Kids", "Girls’ and boys’ festive, casual and occasion dressing.", "/kids"],
]

export default function CollectionsPage() {
  return (
    <main className="bg-cream text-charcoal">
      <section className="relative overflow-hidden border-b border-black/10">
        <div className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
          <p className="text-[9px] font-semibold uppercase tracking-[0.3em] text-secondary">NOORÉ / Collections</p>
          <h1 className="mt-4 max-w-4xl font-editorial text-5xl leading-[.95] md:text-8xl">Curated worlds.<br />Beautifully considered.</h1>
          <p className="mt-7 max-w-2xl text-sm leading-7 text-secondary">Explore collections shaped around season, occasion, mood and the modern Pakistani wardrobe — across women, men and kids.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            {departments.map(([name, copy, href]) => <Link key={name} href={href} className="rounded-full border border-charcoal/20 px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] transition hover:bg-charcoal hover:text-white">{name}</Link>)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="mb-9 flex items-end justify-between gap-5">
          <div><p className="text-[9px] uppercase tracking-[0.28em] text-secondary">The NOORÉ edit</p><h2 className="mt-2 font-editorial text-4xl md:text-5xl">Collections for every moment.</h2></div>
          <Link href="/products" className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4 md:block">Shop all</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {collections.map(([name, copy, image, href], i) => (
            <Link href={href} key={name} className={`group relative overflow-hidden bg-charcoal text-white ${i === 0 || i === 3 ? "sm:row-span-2 min-h-[620px]" : "min-h-[430px]"}`}>
              <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" loading={i < 3 ? "eager" : "lazy"} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="text-[9px] uppercase tracking-[0.25em] text-white/65">Collection</p>
                <h3 className="mt-2 font-editorial text-4xl">{name}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/75">{copy}</p>
                <span className="mt-5 inline-block text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">Explore collection</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-black/10 bg-white/40">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3 md:px-8 md:py-20">
          {departments.map(([name, copy, href]) => <Link href={href} key={name} className="group border-t border-black/15 pt-5"><p className="text-[9px] uppercase tracking-[0.28em] text-secondary">Shop</p><h2 className="mt-2 font-editorial text-4xl">{name}</h2><p className="mt-3 text-sm leading-6 text-secondary">{copy}</p><span className="mt-5 inline-block text-[9px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4 group-hover:no-underline">View department</span></Link>)}
        </div>
      </section>
    </main>
  )
}
