export const dynamic = "force-dynamic"
export const revalidate = 0

import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowUpRight, BookOpen } from "lucide-react"

type BlogPageProps = {
  searchParams?: { category?: string }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const selectedCategory = searchParams?.category?.trim() || ""

  const [posts, allPosts] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        published: true,
        ...(selectedCategory ? { category: selectedCategory } : {}),
      },
      orderBy: { publishedAt: "desc" },
    }),
    prisma.blogPost.findMany({
      where: { published: true },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ])

  const categories = allPosts.map((post) => post.category).filter(Boolean)

  return (
    <main className="min-h-screen bg-[#211b1d] text-[#f5f0e7]">
      <section className="border-b border-[#51423a] bg-[#171315] px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#c6a879]">NOORÉ / Stories & inspiration</p>
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-editorial text-5xl leading-tight sm:text-6xl md:text-7xl">The NOORÉ Journal.</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#c2b8b0] sm:text-base">Ideas, style notes and stories from the world of NOORÉ.</p>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-[#a99d92]">
              <BookOpen className="h-4 w-4 text-[#c6a15b]" />
              {posts.length} {posts.length === 1 ? "story" : "stories"}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:py-14">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#51423a] pb-7" aria-label="Filter journal by category">
          <Link
            href="/blog"
            aria-current={!selectedCategory ? "page" : undefined}
            className={`rounded-full border px-4 py-2 text-xs font-medium transition ${!selectedCategory ? "border-[#c6a15b] bg-[#c6a15b] text-[#171315]" : "border-[#51423a] text-[#c2b8b0] hover:border-[#c6a15b] hover:text-[#f5f0e7]"}`}
          >
            All stories
          </Link>
          {categories.map((category) => {
            const active = category === selectedCategory
            return (
              <Link
                key={category}
                href={`/blog?category=${encodeURIComponent(category)}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-xs font-medium transition ${active ? "border-[#c6a15b] bg-[#c6a15b] text-[#171315]" : "border-[#51423a] text-[#c2b8b0] hover:border-[#c6a15b] hover:text-[#f5f0e7]"}`}
              >
                {category}
              </Link>
            )
          })}
        </div>

        {posts.length === 0 ? (
          <div className="mx-auto max-w-xl py-20 text-center">
            <BookOpen className="mx-auto h-9 w-9 text-[#c6a15b]" />
            <h2 className="mt-5 font-editorial text-3xl">No stories in this edit yet.</h2>
            <p className="mt-3 text-sm leading-6 text-[#a99d92]">There are no published articles in {selectedCategory ? `“${selectedCategory}”` : "the journal"} right now. Please explore another category.</p>
            {selectedCategory && <Link href="/blog" className="mt-6 inline-flex rounded-xl bg-[#c6a15b] px-5 py-3 text-xs font-bold uppercase tracking-[.12em] text-[#171315]">View all stories</Link>}
          </div>
        ) : (
          <div className="grid gap-x-6 gap-y-10 pt-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <article key={post.id} className="group min-w-0">
                <Link href={`/blog/${post.slug}`} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#171315]">
                    {post.image ? (
                      <img src={post.image} alt={post.title} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" />
                    ) : (
                      <div className="grid h-full w-full place-items-center border border-[#51423a] text-[#c6a15b]"><BookOpen className="h-10 w-10" /></div>
                    )}
                    <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-[#171315]/85 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.16em] text-[#e6cfaa] backdrop-blur">{post.category}</span>
                  </div>
                  <div className="pt-5">
                    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[.14em] text-[#a99d92]">
                      <span>{post.publishedAt ? format(new Date(post.publishedAt), "MMM d, yyyy") : "NOORÉ Journal"}</span>
                      <span className="h-px w-5 bg-[#c6a15b]/60" />
                      <span>{post.author}</span>
                    </div>
                    <h2 className="mt-3 font-editorial text-2xl leading-snug text-[#f5f0e7] transition group-hover:text-[#e0c18a]">{post.title}</h2>
                    {post.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-[#a99d92]">{post.excerpt}</p>}
                    <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-[#d8bd8d]">Read story <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
