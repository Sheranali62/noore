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
    <section className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <div className="mb-7 max-w-3xl sm:mb-10">
        <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-black/50 dark:text-white/50">{eyebrow}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-black/60 dark:text-white/60 sm:text-base">{description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="group overflow-hidden rounded-2xl border border-black/10 bg-white transition duration-300 hover:-translate-y-1 hover:border-black/20 hover:shadow-xl dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-black/5 dark:bg-white/5">
              <Image
                src={category.image}
                alt={category.name}
                fill
                sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
                className="object-cover transition duration-700 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/45 to-transparent" />
              <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm text-black shadow-sm backdrop-blur transition group-hover:translate-x-0.5 dark:bg-black/75 dark:text-white">↗</span>
            </div>
            <div className="p-4 sm:p-5">
              <h2 className="text-sm font-semibold sm:text-base">{category.name}</h2>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-5 text-black/55 dark:text-white/55 sm:text-xs">{category.description}</p>
              <span className="mt-3 inline-block text-[9px] font-medium uppercase tracking-[0.22em] text-black/50 dark:text-white/50">Shop edit</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
