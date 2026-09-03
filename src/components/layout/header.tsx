"use client"

import Link from "next/link"
import { useState } from "react"
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react"
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

export function Header() {
  const { count, toggleCart } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    if (q) window.location.href = `/search?q=${encodeURIComponent(q)}`
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
          <button type="button" onClick={() => setSearchOpen(v => !v)} className="icon-button" aria-label="Search"><Search className="h-[18px] w-[18px]" /></button>
          <Link href="/account" className="icon-button hidden sm:grid" aria-label="Account"><UserRound className="h-[18px] w-[18px]" /></Link>
          <Link href="/wishlist" className="icon-button hidden sm:grid" aria-label="Wishlist"><Heart className="h-[18px] w-[18px]" /></Link>
          <button type="button" onClick={toggleCart} className="icon-button relative" aria-label={`Shopping bag${count ? `, ${count} items` : ""}`}>
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-charcoal px-1 text-[9px] font-bold text-white">{count > 99 ? "99+" : count}</span>}
          </button>
        </div>
      </div>

      {searchOpen && <div className="border-t border-black/5 bg-white px-4 py-4"><form onSubmit={submitSearch} className="mx-auto flex max-w-2xl items-center border-b border-charcoal/30"><Search className="mr-2 h-4 w-4 text-secondary" /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search dresses, fabrics, collections..." className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none" /><button className="py-3 text-[10px] font-semibold uppercase tracking-[.18em]">Search</button></form></div>}

      {megaOpen && <div className="mega-menu hidden border-t border-black/5 bg-white md:block"><div className="mx-auto grid max-w-7xl grid-cols-4 gap-8 px-5 py-8"><div><p className="eyebrow">Shop women</p><div className="mt-4 space-y-2 text-sm"><Link href="/products?gender=Women" className="block hover:underline">All Women</Link><Link href="/products?category=Ready%20to%20Wear" className="block hover:underline">Ready to Wear</Link><Link href="/products?category=Unstitched" className="block hover:underline">Unstitched</Link><Link href="/products?category=Luxury" className="block hover:underline">Luxury Edit</Link></div></div><div><p className="eyebrow">Shop men</p><div className="mt-4 space-y-2 text-sm"><Link href="/products?gender=Men" className="block hover:underline">All Men</Link><Link href="/products?category=Men" className="block hover:underline">Men&apos;s Collection</Link><Link href="/products?sale=1" className="block hover:underline">Sale</Link></div></div><div><p className="eyebrow">Explore</p><div className="mt-4 space-y-2 text-sm"><Link href="/search" className="block hover:underline">Search</Link><Link href="/blog" className="block hover:underline">Journal</Link><Link href="/account/orders" className="block hover:underline">Orders</Link><Link href="/wishlist" className="block hover:underline">Wishlist</Link></div></div><div className="bg-cream p-5"><p className="eyebrow">The NOORÉ edit</p><p className="mt-3 font-editorial text-2xl">Quiet luxury, made for every day.</p><Link href="/products" className="mt-5 inline-block border-b border-charcoal pb-1 text-[10px] font-semibold uppercase tracking-[.18em]">Shop the edit</Link></div></div></div>}

      {mobileOpen && <div className="fixed inset-0 z-[70] md:hidden"><button className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-label="Close menu" /><aside className="absolute left-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto bg-cream p-5 shadow-2xl"><div className="flex items-center justify-between border-b border-black/5 pb-5"><Link href="/" onClick={() => setMobileOpen(false)} className="font-editorial text-2xl font-semibold">NOORÉ</Link><button onClick={() => setMobileOpen(false)} aria-label="Close menu"><X className="h-5 w-5" /></button></div><form onSubmit={submitSearch} className="mt-5 flex items-center border border-black/10 bg-white px-3"><Search className="h-4 w-4 text-secondary" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" /></form><nav className="mt-7 space-y-1">{nav.map(item => <Link key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">{item.label}</Link>)}<Link href="/account" onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">Account</Link><Link href="/wishlist" onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">Wishlist</Link><Link href="/account/orders" onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">My Orders</Link><Link href="/blog" onClick={() => setMobileOpen(false)} className="block border-b border-black/5 py-4 text-sm">Journal</Link></nav><div className="mt-8 bg-white p-5"><p className="eyebrow">Need help?</p><p className="mt-2 text-sm text-secondary">Our team is here for delivery, sizing and order questions.</p></div></aside></div>}
    </header>
  )
}
