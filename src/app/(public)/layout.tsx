"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { useCart } from "@/components/cart/cart-context"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { InterestTracker } from "@/components/personalization/interest-tracker"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [announcement, setAnnouncement] = useState("FREE SHIPPING ON ORDERS ABOVE PKR 5,000")
  const [siteName, setSiteName] = useState("NOORÉ")
  const { toggleCart } = useCart()

  useEffect(() => {
    fetch("/api/settings").then(r => r.ok ? r.json() : null).then(data => {
      const s = data?.settings || data
      if (s?.announcementText) setAnnouncement(s.announcementText)
      if (s?.siteName) setSiteName(s.siteName)
    }).catch(() => {})
  }, [])

  // Keep public storefront content fresh without doing a full browser reload.
  // router.refresh() updates server-rendered data while preserving cart/UI state.
  useEffect(() => {
    const refreshEveryMs = 60_000
    const idleForMs = 8_000
    let lastInteraction = Date.now()

    const markInteraction = () => {
      lastInteraction = Date.now()
    }

    const refreshPage = () => {
      if (document.visibilityState !== "visible") return

      if (pathname === "/checkout" || pathname.startsWith("/checkout/")) return

      const active = document.activeElement
      const isEditing =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        active?.hasAttribute("contenteditable")

      const menuOpen = document.querySelector("[data-noore-menu-open=\"true\"]")
      const dialogOpen = document.querySelector("[role=dialog]")
      const userIsActive = Date.now() - lastInteraction < idleForMs

      if (isEditing || menuOpen || dialogOpen || userIsActive) return

      router.refresh()
    }

    window.addEventListener("pointerdown", markInteraction, { passive: true })
    window.addEventListener("keydown", markInteraction)
    window.addEventListener("scroll", markInteraction, { passive: true })

    const interval = window.setInterval(refreshPage, refreshEveryMs)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener("pointerdown", markInteraction)
      window.removeEventListener("keydown", markInteraction)
      window.removeEventListener("scroll", markInteraction)
    }
  }, [pathname, router])

  return <>
    <div className="bg-charcoal px-4 py-2 text-center text-[9px] font-semibold uppercase tracking-[.2em] text-white sm:text-[10px]">{announcement}</div>
    <Header />
    <InterestTracker />
    <main id="main-content">{children}</main>
    <footer className="border-t border-white/10 bg-charcoal text-white/75">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2"><Link href="/" className="font-editorial text-3xl font-semibold text-white">{siteName}</Link><p className="mt-4 max-w-md text-sm leading-6 text-white/55">Premium Pakistani fashion for the modern wardrobe — considered pieces, contemporary silhouettes and timeless elegance.</p><div className="mt-6 flex flex-wrap gap-4 text-[10px] uppercase tracking-[.16em]"><a href="#" className="hover:text-white">Instagram</a><a href="#" className="hover:text-white">Facebook</a><a href="#" className="hover:text-white">YouTube</a></div></div>
        <div><p className="eyebrow text-white/45">Shop</p><div className="mt-4 space-y-3 text-sm"><Link href="/products" className="block hover:text-white">All Collection</Link><Link href="/products?sale=1" className="block hover:text-white">Sale</Link><Link href="/wishlist" className="block hover:text-white">Wishlist</Link><Link href="/search" className="block hover:text-white">Search</Link></div></div>
        <div><p className="eyebrow text-white/45">Help</p><div className="mt-4 space-y-3 text-sm"><Link href="/account/orders" className="block hover:text-white">Track Orders</Link><Link href="/account/addresses" className="block hover:text-white">Addresses</Link><Link href="/account" className="block hover:text-white">My Account</Link><button onClick={() => session ? signOut() : toggleCart()} className="block hover:text-white">{session ? "Sign out" : "Open bag"}</button></div></div>
      </div>
      <div className="border-t border-white/10"><div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-[10px] text-white/35 sm:flex-row sm:items-center sm:justify-between"><span>© 2026 {siteName}. All rights reserved.</span><span>Cash on Delivery · Pakistan</span></div></div>
    </footer>
    <CartDrawer />
    <WhatsAppButton />
  </>
}
