"use client"

import { useEffect, useState } from "react"
import { ArrowUp, X, Truck, Sparkles } from "lucide-react"
import { usePathname } from "next/navigation"
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
  const [announcement, setAnnouncement] = useState("FREE SHIPPING ON ORDERS ABOVE PKR 5,000")
  const [siteName, setSiteName] = useState("NOORÉ")
  const [announcementVisible, setAnnouncementVisible] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [showTop, setShowTop] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const { toggleCart } = useCart()

  useEffect(() => {
    try {
      setAnnouncementVisible(localStorage.getItem("noore_announcement_hidden") !== "1")
    } catch {}
  }, [])

  useEffect(() => {
    let frame = 0
    let lastProgress = -1

    const update = () => {
      frame = 0
      const scrollTop = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrolled(scrollTop > 16)
      setShowTop(scrollTop > 600)
      const progress = max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0
      if (Math.abs(progress - lastProgress) >= 1) {
        lastProgress = progress
        setScrollProgress(progress)
      }
    }

    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  const dismissAnnouncement = () => {
    setAnnouncementVisible(false)
    try { localStorage.setItem("noore_announcement_hidden", "1") } catch {}
  }

  const restoreAnnouncement = () => {
    setAnnouncementVisible(true)
    try { localStorage.removeItem("noore_announcement_hidden") } catch {}
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" })

  useEffect(() => {
    fetch("/api/settings").then(r => r.ok ? r.json() : null).then(data => {
      const s = data?.settings || data
      if (s?.announcementText) setAnnouncement(s.announcementText)
      if (s?.siteName) setSiteName(s.siteName)
    }).catch(() => {})
  }, [])

  // Do not periodically refresh the whole storefront.
  // Full router.refresh() calls were causing avoidable database/render work
  // while customers were simply browsing. Product data is cached/revalidated
  // server-side instead.

  return <>
    {/* Floating luxury announcement */}
    {announcementVisible && (
      <div className="pointer-events-none fixed inset-x-0 top-[76px] z-[70] flex justify-center px-3 sm:top-[82px]">
        <div className="pointer-events-auto relative flex max-w-[min(92vw,760px)] items-center gap-3 overflow-hidden rounded-full border border-[#d6ae72]/30 bg-[#24151c]/95 px-4 py-2.5 text-[#f8eee5] shadow-[0_14px_40px_rgba(36,21,28,.24)] backdrop-blur-xl sm:px-5">
          <span className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d6ae72]/15 text-[#d6ae72]">
            <Truck className="h-3.5 w-3.5" />
            <span className="absolute inset-0 animate-ping rounded-full border border-[#d6ae72]/20" />
          </span>
          <div className="min-w-0 overflow-hidden whitespace-nowrap text-[8px] font-semibold uppercase tracking-[.16em] sm:text-[9px] sm:tracking-[.2em]">
            <div className="noore-announcement-track flex w-max items-center gap-8">
              <span>{announcement}</span><span className="text-[#d6ae72]">✦</span>
              <span>Cash on Delivery across Pakistan</span><span className="text-[#d6ae72]">✦</span>
              <span>Easy order tracking</span><span className="text-[#d6ae72]">✦</span>
              <span>{announcement}</span>
            </div>
          </div>
          <button type="button" onClick={dismissAnnouncement} className="ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.06] text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="Dismiss announcement">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    )}

    <Header scrolled={scrolled} />
    <div className="fixed left-0 right-0 top-[68px] z-[55] h-px bg-black/5">
      <div className="h-full origin-left bg-[#d6ae72] transition-[width] duration-100" style={{ width: `${scrollProgress}%` }} />
    </div>
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

    {showTop && (
      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-20 right-4 z-[80] grid h-11 w-11 place-items-center rounded-full border border-[#d6ae72]/30 bg-[#24151c]/95 text-[#f5dfba] shadow-[0_12px_30px_rgba(36,21,28,.24)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-[#321526] sm:bottom-6 sm:right-6"
        aria-label="Back to top"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    )}

    {!announcementVisible && (
      <button type="button" onClick={restoreAnnouncement} className="fixed bottom-6 left-4 z-[75] hidden items-center gap-2 rounded-full border border-black/10 bg-white/90 px-3 py-2 text-[8px] font-bold uppercase tracking-[.16em] text-charcoal shadow-lg backdrop-blur-xl sm:flex">
        <Sparkles className="h-3 w-3" /> Offers
      </button>
    )}
  </>
}
