import Link from "next/link"

type Category = {
  name: string
  description: string
  href: string
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
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 max-w-2xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-black/50 dark:text-white/50">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-black/60 dark:text-white/60">{description}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.name}
            href={category.href}
            className="group rounded-2xl border border-black/10 bg-white p-5 transition hover:-translate-y-0.5 hover:border-black/20 hover:shadow-sm dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold">{category.name}</h3>
              <span className="text-black/35 transition-transform group-hover:translate-x-0.5 dark:text-white/35">↗</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-black/55 dark:text-white/55">{category.description}</p>
            <span className="mt-4 inline-block text-[10px] font-medium uppercase tracking-[0.2em] text-black/50 dark:text-white/50">Shop edit</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
