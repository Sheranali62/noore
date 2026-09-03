"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { Heart, Menu, Search, ShoppingBag, UserRound, X, ArrowUpRight, Clock3, Command } from "lucide-react"
import { useCart } from "@/components/cart/cart-context"

const nav = [
  { label: "New In", href: "/products" },
  { label: "Women", href: "/products?gender=Women" },
  { label: "Men", href: "/products?gender=Men" },
  { label: "Ready to Wear", href: "/products?category=Ready%20to%20Wear" },
  { label: "Luxury", href: "/products?category=Luxury" },
  { label: "Accessories", href: "/products?category=Accessories" },
  { label: "Sale", href: "/products?sale=1" },
]

type SearchProduct = {
  id: string
  name: string
  slug: string
  price: number
  salePrice: number | null
  images: string[]
  category: string
}

const popularSearches = ["New arrivals", "Ready to Wear", "Luxury", "Unstitched", "Sale"]

export function Header() {
  const { count, toggleCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("noore_recent_searches") || "[]")
      if (Array.isArray(stored)) setRecentSearches(stored.filter((v): v is string => typeof v === "string").slice(0, 5))
    } catch {}
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"
      if (isShortcut) {
        event.preventDefault()
        setSearchOpen(true)
        window.setTimeout(() => inputRef.current?.focus(), 0)
      }
      if (event.key === "Escape") setSearchOpen(false)
      if (!searchOpen || !results.length) return
      if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(index => Math.min(index + 1, results.length - 1)) }
      if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(index => Math.max(index - 1, 0)) }
      if (event.key === "Enter" && activeIndex >= 0) {
        event.preventDefault()
        const product = results[activeIndex]
        saveRecent(query)
        window.location.href = `/product/${product.slug}`
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [searchOpen, results, activeIndex, query])

  useEffect(() => {
    setActiveIndex(-1)
  }, [query])

  useEffect(() => {
    if (!searchOpen) return
    const q = query.trim()
    if (!q) {
      setResults([])
      setLoading(false)
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/search?q=${encodeURIComponent(q)}&take=8`, { signal: controller.signal })
        if (!response.ok) throw new Error("Search failed")
        const data = await response.json()
        setResults(Array.isArray(data.products) ? data.products : [])
        setActiveIndex(-1)
      } catch (error) {
        if ((error as Error).name !== "AbortError") setResults([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query, searchOpen])

  const saveRecent = (term: string) => {
    const value = term.trim()
    if (!value) return
    const next = [value, ...recentSearches.filter(item => item.toLowerCase() !== value.toLowerCase())].slice(0, 5)
    setRecentSearches(next)
    try { localStorage.setItem("noore_recent_searches", JSON.stringify(next)) } catch {}
  }

  const submitSearch = (event?: React.FormEvent) => {
    event?.preventDefault()
    const q = query.trim()
    if (!q) return
    saveRecent(q)
    window.location.href = `/search?q=${encodeURIComponent(q)}`
  }

  const chooseSuggestion = (value: string) => {
    setQuery(value)
    saveRecent(value)
    window.location.href = `/search?q=${encodeURIComponent(value)}`
  }

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-cream/95 backdrop-blur-xl">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-5">
        <button className="mr-3 md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
        <Link href="/" className="font-editorial text-[28px] font-semibold tracking-tight">NOORÉ</Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/products" className="nav-link">Shop All</Link>
          <button type="button" className="nav-link inline-flex items-center gap-1" onClick={() => setMegaOpen(v => !v)} aria-expanded={megaOpen}>Collections <span className="text-[9px]">⌄</span></button>
          {nav.slice(0, 4).map(item => <Link key={item.label} href={item.href} className="nav-link">{item.label}</Link>)}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <button type="button" onClick={() => { setSearchOpen(true); window.setTimeout(() => inputRef.current?.focus(), 0) }} className="icon-button" aria-label="Search">
            <Search className="h-[18px] w-[18px]" />
            <span className="absolute -bottom-0.5 left-1/2 hidden -translate-x-1/2 text-[7px] text-secondary lg:block">⌘K</span>
          </button>
          <Link href="/account" className="icon-button hidden sm:grid" aria-label="Account"><UserRound className="h-[18px] w-[18px]" /></Link>
          <Link href="/wishlist" className="icon-button hidden sm:grid" aria-label="Wishlist"><Heart className="h-[18px] w-[18px]" /></Link>
          <button type="button" onClick={toggleCart} className="icon-button relative" aria-label={`Shopping bag${count ? `, ${count} items` : ""}`}>
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-charcoal px-1 text-[9px] font-bold text-white">{count > 99 ? "99+" : count}</span>}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="fixed inset-0 z-[80] bg-charcoal/45 backdrop-blur-sm" onMouseDown={() => setSearchOpen(false)}>
          <div className="mx-auto mt-0 w-full max-w-3xl px-3 sm:px-5 md:mt-8" onMouseDown={event => event.stopPropagation()}>
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
              <form onSubmit={submitSearch} className="flex items-center gap-3 border-b border-black/10 px-4 py-3 sm:px-5">
                <Search className="h-5 w-5 shrink-0 text-secondary" />
                <input ref={inputRef} autoFocus value={query} onChange={event => setQuery(event.target.value)} placeholder="Try ‘black cotton under 5000’…" className="min-w-0 flex-1 bg-transparent py-3 text-base outline-none" aria-label="Search NOORÉ" aria-controls="noore-search-results" aria-activedescendant={activeIndex >= 0 ? `noore-result-${activeIndex}` : undefined} />
                <kbd className="hidden rounded-md border border-black/10 px-2 py-1 text-[10px] text-secondary sm:block">ESC</kbd>
                <button type="button" onClick={() => setSearchOpen(false)} className="rounded-full p-2 hover:bg-black/5" aria-label="Close search"><X className="h-4 w-4" /></button>
              </form>

              <div id="noore-search-results" className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
                {!query.trim() ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-secondary"><Command className="h-3 w-3" /> Popular searches</div><p className="mb-2 text-xs text-secondary">Search naturally by product, fabric, color, size or budget.</p>
                      <div className="space-y-1">{popularSearches.map(item => <button key={item} type="button" onClick={() => chooseSuggestion(item)} className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm hover:bg-cream"><span>{item}</span><ArrowUpRight className="h-3.5 w-3.5 text-secondary" /></button>)}</div>
                    </div>
                    <div>
                      <div className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.18em] text-secondary"><Clock3 className="h-3 w-3" /> Recent searches</div>
                      {recentSearches.length ? <div className="space-y-1">{recentSearches.map(item => <button key={item} type="button" onClick={() => chooseSuggestion(item)} className="block w-full rounded-lg px-3 py-3 text-left text-sm hover:bg-cream">{item}</button>)}</div> : <p className="px-3 text-sm text-secondary">Your recent searches will appear here.</p>}
                    </div>
                  </div>
                ) : loading ? (
                  <div className="py-12 text-center text-sm text-secondary">Searching the NOORÉ collection…</div>
                ) : results.length ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-secondary">Products</p><button type="button" onClick={() => submitSearch()} className="text-[10px] font-semibold uppercase tracking-[.15em] underline underline-offset-4">View all</button></div>
                    <div className="grid gap-1">{results.map((product, index) => <Link key={product.id} id={`noore-result-${index}`} href={`/product/${product.slug}`} onClick={() => { saveRecent(query); setSearchOpen(false) }} className={`group flex items-center gap-3 rounded-xl p-2 transition hover:bg-cream ${activeIndex === index ? "bg-cream" : ""}`}><div className="h-16 w-14 shrink-0 overflow-hidden bg-cream">{product.images?.[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" /> : null}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{product.name}</p><p className="mt-1 text-[10px] uppercase tracking-[.12em] text-secondary">{product.category}</p></div><div className="text-right text-sm">{product.salePrice != null ? <><span className="block font-medium">PKR {product.salePrice.toLocaleString()}</span><span className="text-xs text-secondary line-through">PKR {product.price.toLocaleString()}</span></> : <span>PKR {product.price.toLocaleString()}</span>}</div><ArrowUpRight className="mr-1 h-4 w-4 text-secondary" /></Link>)}</div>
                  </div>
                ) : (
                  <div className="py-12 text-center"><Search className="mx-auto h-6 w-6 text-secondary" /><p className="mt-3 font-editorial text-2xl">No pieces found</p><p className="mt-1 text-sm text-secondary">Try a different product, category, fabric or SKU.</p></div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {megaOpen && <div className="mega-menu hidden border-t border-black/5 bg-white md:block"><div className="mx-auto grid max-w-7xl grid-cols-4 gap-8 px-5 py-8"><div><p className="eyebrow">Shop women</p><div className="mt-4 space-y-2 text-sm"><Link href="/products?gender=Women" className="block hover:underline">All Women</Link><Link href="/products?category=Ready%20to%20Wear" className="block hover:underline">Ready to Wear</Link><Link href="/products?category=Unstitched" className="block hover:underline">Unstitched</Link><Link href="/products?category=Luxury" className="block hover:underline">Luxury Edit</Link></div></div><div><p className="eyebrow">Shop men</p><div className="mt-4 space-y-2 text-sm"><Link href="/products?gender=Men" className="block hover:underline">All Men</Link><Link href="/products?category=Men" className="block hover:underline">Men&apos;s Collection</Link><Link href="/products?sale=1" className="block hover:underline">Sale</Link></div></div><div><p className="eyebrow">Explore</p><div className="mt-4 space-y-2 text-sm"><Link href="/search" className="block hover:underline">Search</Link><Link href="/blog" className="block hover:underline">Journal</Link><Link href="/account/orders" className="block hover:underline">Orders</Link><Link href="/wishlist" className="block hover:underline">Wishlist</Link></div></div><div className="bg-cream p-5"><p className="eyebrow">The NOORÉ edit</p><p className="mt-3 font-editorial text-2xl">Quiet luxury, made for every day.</p><Link href="/products" className="mt-5 inline-block border-b border-charcoal pb-1 text-[10px] font-semibold uppercase tracking-[.18em]">Shop the edit</Link></div></div></div>}

      {mobileOpen && <div className="fixed inset-0 z-[70] md:hidden"><button className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Close menu" /><aside className="absolute left-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-cream p-5 shadow-2xl"><div className="flex items-center justify-between border-b border-black/5 pb-5"><Link href="/" onClick={() => setMobileOpen(false)} className="font-editorial text-2xl font-semibold">NOORÉ</Link><button onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div><button type="button" onClick={() => { setMobileOpen(false); setSearchOpen(true); window.setTimeout(() => inputRef.current?.focus(), 0) }} className="mt-5 flex w-full items-center gap-3 border border-black/10 bg-white px-3 py-3 text-left text-sm"><Search className="h-4 w-4 text-secondary" /> Search NOORÉ <span className="ml-auto text-[10px] text-secondary">⌘K</span></button><nav className="mt-7 space-y-1">{nav.map(item => <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">{item.label}</Link>)}<Link href="/account" onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">Account</Link><Link href="/wishlist" onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">Wishlist</Link><Link href="/account/orders" onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">My Orders</Link><Link href="/blog" onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">Journal</Link></nav><div className="mt-8 bg-white p-5"><p className="eyebrow">Need help?</p><p className="mt-2 text-sm text-secondary">Our team is here for delivery, sizing and order questions.</p></div></aside></div>}
    </header>
  )
}
