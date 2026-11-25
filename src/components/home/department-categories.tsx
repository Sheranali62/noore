import Image from "next/image"
import Link from "next/link"

type Category = {
  name: string
  description: string
  href: string
  image: string
}

export function DepartmentCategories({
  eyebrow,
  title,
  description,
  categories,
}: {
  eyebrow: string
  title: string
  description: string
  categories: Category[]
}) {
  return (
    <section className="bg-[#171513] text-[#f5f0e7]">
      <div className="noore-department-container mx-auto max-w-[1600px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-20">
        <div className="mb-8 max-w-3xl border-b border-[#c9a66b]/25 pb-7 sm:mb-10 sm:pb-9">
          <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#d6b77c]">{eyebrow}</p>
          <h1 className="mt-3 font-editorial text-4xl font-medium leading-[.98] tracking-[-.025em] sm:text-5xl lg:text-6xl">{title}</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c9c0b4] sm:text-base">{description}</p>
        </div>

        <div className="noore-category-grid gap-2.5 sm:gap-3">
          {categories.map((category, index) => (
            <Link
              key={category.name}
              href={category.href}
              className="group relative isolate overflow-hidden border border-[#d6ae72]/15 bg-[#211c1b] text-white transition duration-300 hover:-translate-y-1 hover:border-[#d6ae72]/55"
            >
              <div className="relative aspect-[.78] overflow-hidden bg-[#28211e]">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  unoptimized
                  sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.06]"
                  priority={index < 4}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#100d0d]/95 via-[#100d0d]/10 to-transparent" />
                <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/30 bg-black/25 text-sm text-[#f0d8a8] backdrop-blur-sm transition group-hover:border-[#d6ae72] group-hover:bg-[#d6ae72] group-hover:text-[#171513]">↗</span>
                <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
                  <p className="mb-1 text-[8px] font-semibold uppercase tracking-[.22em] text-[#d6b77c]">NOORÉ EDIT</p>
                  <h2 className="font-editorial text-2xl leading-none sm:text-3xl">{category.name}</h2>
                  <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-white/70 sm:text-xs">{category.description}</p>
                  <span className="mt-3 inline-block border-b border-[#d6ae72]/70 pb-1 text-[8px] font-semibold uppercase tracking-[.2em] text-[#f0d8a8]">Shop category</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
