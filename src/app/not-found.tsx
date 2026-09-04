import Link from "next/link"

export default function NotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center bg-cream px-6 text-center">
      <div className="max-w-lg">
        <p className="font-editorial text-7xl">404</p>
        <p className="mt-4 text-[10px] font-semibold uppercase tracking-[.25em] text-secondary">Page not found</p>
        <h1 className="mt-3 font-editorial text-4xl">This piece has moved.</h1>
        <p className="mt-4 text-sm leading-6 text-secondary">The page you&apos;re looking for is unavailable or no longer part of the current edit.</p>
        <Link href="/products" className="mt-7 inline-flex bg-charcoal px-6 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white">Explore the collection</Link>
      </div>
    </div>
  )
}
