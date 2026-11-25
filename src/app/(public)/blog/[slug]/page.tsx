import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://noore-nine.vercel.app"

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: (await params).slug, published: true },
    select: {
      title: true,
      excerpt: true,
      content: true,
      image: true,
      author: true,
      publishedAt: true,
      slug: true,
    },
  })

  if (!post) {
    return { title: "Story not found | NOORÉ", robots: { index: false, follow: false } }
  }

  const plainText = post.content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
  const description = (post.excerpt || plainText || `Read ${post.title} in the NOORÉ Journal.`).slice(0, 160)
  const canonicalUrl = `${SITE_URL.replace(/\/$/, "")}/blog/${post.slug}`

  return {
    title: `${post.title} | NOORÉ Journal`,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "article",
      url: canonicalUrl,
      title: post.title,
      description,
      siteName: "NOORÉ",
      publishedTime: post.publishedAt?.toISOString(),
      authors: [post.author],
      images: post.image ? [{ url: post.image, alt: post.title }] : undefined,
    },
    twitter: {
      card: post.image ? "summary_large_image" : "summary",
      title: post.title,
      description,
      images: post.image ? [post.image] : undefined,
    },
  }
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: (await params).slug, published: true },
  })

  if (!post) notFound()

  const relatedPosts = await prisma.blogPost.findMany({
    where: {
      published: true,
      category: post.category,
      id: { not: post.id },
    },
    take: 3,
  })

  const articleUrl = `${SITE_URL.replace(/\/$/, "")}/blog/${post.slug}`
  const shareTitle = encodeURIComponent(post.title)
  const shareUrl = encodeURIComponent(articleUrl)

  return (
    <div className="min-h-screen bg-cream py-12">
      <article className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <Link href="/blog" className="text-secondary hover:text-charcoal transition inline-flex items-center gap-2 mb-6">
          ← Back to Blog
        </Link>

        {/* Hero Image */}
        {post.image && (
          <div className="aspect-[21/9] overflow-hidden rounded-lg bg-cream mb-8">
            <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-lg border border-cream p-8 md:p-12">
          <div className="flex items-center gap-3 text-sm text-secondary mb-4">
            <span className="bg-cream px-3 py-1 rounded-full">{post.category}</span>
            <span>{post.publishedAt ? format(new Date(post.publishedAt), "MMMM d, yyyy") : ""}</span>
            <span>• {post.author}</span>
          </div>

          <h1 className="font-editorial text-3xl md:text-4xl font-semibold">{post.title}</h1>

          {post.excerpt && (
            <p className="text-secondary text-lg mt-4 border-l-4 border-charcoal pl-4 italic">
              {post.excerpt}
            </p>
          )}

          <div
            className="prose prose-lg max-w-none mt-6"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Share Buttons */}
          <div className="border-t border-cream mt-8 pt-6">
            <p className="text-sm text-secondary mb-3">Share this article</p>
            <div className="flex flex-wrap gap-3">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share ${post.title} on Facebook`}
                className="rounded bg-[#1877F2] p-2 text-white transition hover:opacity-80"
              >
                Facebook
              </a>
              <a
                href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share ${post.title} on X`}
                className="rounded bg-[#1DA1F2] p-2 text-white transition hover:opacity-80"
              >
                X
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Share ${post.title} on LinkedIn`}
                className="rounded bg-[#0A66C2] p-2 text-white transition hover:opacity-80"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h3 className="font-editorial text-2xl font-semibold mb-6">Related Articles</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="bg-white rounded-lg border border-cream p-4 hover:shadow-lg transition"
                >
                  {related.image && (
                    <img src={related.image} alt={related.title} className="w-full h-32 object-cover rounded mb-3" />
                  )}
                  <h4 className="font-medium text-sm">{related.title}</h4>
                  <p className="text-xs text-secondary mt-1">{related.category}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  )
}
