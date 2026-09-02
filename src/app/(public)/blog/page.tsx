import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { format } from "date-fns"

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
  })

  const categories = [...new Set(posts.map(p => p.category))]

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-editorial text-4xl md:text-5xl font-semibold">The NOORÉ Journal</h1>
          <p className="text-secondary mt-3 max-w-2xl mx-auto">
            Discover the latest in fashion, style guides, and behind-the-scenes stories
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          <Link href="/blog" className="px-4 py-2 bg-charcoal text-white rounded-full text-sm">
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog?category=${cat}`}
              className="px-4 py-2 bg-white border border-cream rounded-full text-sm hover:border-charcoal transition"
            >
              {cat}
            </Link>
          ))}
        </div>

        {/* Blog Grid */}
        {posts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border border-cream">
            <p className="text-secondary">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-lg overflow-hidden border border-cream hover:shadow-xl transition-all hover:-translate-y-1"
              >
                {post.image && (
                  <div className="aspect-[16/9] overflow-hidden bg-cream">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center gap-3 text-xs text-secondary mb-3">
                    <span className="bg-cream px-3 py-1 rounded-full">{post.category}</span>
                    <span>{post.publishedAt ? format(new Date(post.publishedAt), "MMM d, yyyy") : ""}</span>
                  </div>
                  <h2 className="font-editorial text-xl font-semibold group-hover:text-secondary transition">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-secondary text-sm mt-2 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="mt-4 text-sm font-medium text-charcoal inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read More →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}