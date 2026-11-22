"use client"

import { useEffect, useState } from "react"
import { ArrowUp, X, Truck, Sparkles, Instagram, Facebook, Youtube, MessageCircle, ArrowUpRight, Heart } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { Header } from "@/components/layout/header"
import { useCart } from "@/components/cart/cart-context"
import { CartDrawer } from "@/components/cart/cart-drawer"
import { InterestTracker } from "@/components/personalization/interest-tracker"
import { WhatsAppButton } from "@/components/shared/whatsapp-button"
import { SOCIAL_LINKS } from "@/config/social-links"

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
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
    const onScroll = () => {
      const scrollTop = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      setScrolled(scrollTop > 16)
      setShowTop(scrollTop > 600)
      setScrollProgress(max > 0 ? Math.min(100, (scrollTop / max) * 100) : 0)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
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
    <Header scrolled={scrolled} />
    {announcementVisible && (
      <div className="relative z-40 border-b border-[#d6ae72]/20 bg-[#1b1916] text-[#f8eee5]">
        <div className="mx-auto flex min-h-9 max-w-7xl items-center justify-center gap-3 px-10 py-2 text-center">
          <Truck className="h-3.5 w-3.5 shrink-0 text-[#d6ae72]" />
          <p className="text-[8px] font-semibold uppercase tracking-[.18em] sm:text-[9px] sm:tracking-[.24em]">
            <span>{announcement}</span>
            <span className="mx-3 text-[#d6ae72]">✦</span>
            <span>Cash on Delivery across Pakistan</span>
            <span className="mx-3 text-[#d6ae72]">✦</span>
            <span>Easy order tracking</span>
          </p>
          <button type="button" onClick={dismissAnnouncement} className="absolute right-4 grid h-6 w-6 place-items-center rounded-full border border-white/10 text-white/55 transition hover:border-[#d6ae72]/50 hover:text-[#d6ae72]" aria-label="Dismiss announcement">
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    )}
    <div className="fixed left-0 right-0 top-[68px] z-[55] h-px bg-black/5">
      <div className="h-full origin-left bg-[#d6ae72] transition-[width] duration-100" style={{ width: `${scrollProgress}%` }} />
    </div>
    <InterestTracker />
    <main id="main-content">{children}</main>
    <footer className="border-t border-[#c6a15b]/20 bg-[#171315] text-[#e9e1d8]">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-14 sm:py-16 lg:grid-cols-[1.5fr_1fr_1fr_1.15fr] lg:gap-10">
        <div>
          <Link href="/" aria-label={`${siteName} home`} className="inline-flex items-center gap-2 font-editorial text-3xl font-semibold tracking-[.08em] text-[#f7f0e7]">
            {siteName}<span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#c6a15b]" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-[#aaa09a]">Thoughtful style, considered details and modern essentials. Discover the NOORÉ edit and find pieces made to feel like your own.</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {SOCIAL_LINKS.instagram && !SOCIAL_LINKS.instagram.includes("YOUR_") && <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-[#d6c5a6] transition hover:border-[#c6a15b]/60 hover:bg-[#c6a15b]/10 hover:text-white"><Instagram className="h-4 w-4" /></a>}
            {SOCIAL_LINKS.facebook && !SOCIAL_LINKS.facebook.includes("YOUR_") && <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-[#d6c5a6] transition hover:border-[#c6a15b]/60 hover:bg-[#c6a15b]/10 hover:text-white"><Facebook className="h-4 w-4" /></a>}
            {SOCIAL_LINKS.youtube && !SOCIAL_LINKS.youtube.includes("YOUR_") && <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-[#d6c5a6] transition hover:border-[#c6a15b]/60 hover:bg-[#c6a15b]/10 hover:text-white"><Youtube className="h-4 w-4" /></a>}
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp customer care" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-[#d6c5a6] transition hover:border-[#c6a15b]/60 hover:bg-[#c6a15b]/10 hover:text-white"><MessageCircle className="h-4 w-4" /></a>
          </div>
        </div>
        <nav aria-label="Shop links">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#c6a15b]">Discover</p>
          <div className="mt-5 space-y-3.5 text-sm text-[#aaa09a]">
            <Link href="/products" className="block transition hover:text-[#f7f0e7]">Shop all</Link>
            <Link href="/collections" className="block transition hover:text-[#f7f0e7]">Collections</Link>
            <Link href="/new-in" className="block transition hover:text-[#f7f0e7]">New arrivals</Link>
            <Link href="/sale" className="block transition hover:text-[#f7f0e7]">Sale</Link>
            <Link href="/wishlist" className="block transition hover:text-[#f7f0e7]">Wishlist</Link>
          </div>
        </nav>
        <nav aria-label="Customer care links">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#c6a15b]">Customer care</p>
          <div className="mt-5 space-y-3.5 text-sm text-[#aaa09a]">
            <Link href="/contact" className="block transition hover:text-[#f7f0e7]">Contact & help</Link>
            <Link href="/order-tracking" className="block transition hover:text-[#f7f0e7]">Track an order</Link>
            <Link href="/account/orders" className="block transition hover:text-[#f7f0e7]">My orders</Link>
            <Link href="/account/addresses" className="block transition hover:text-[#f7f0e7]">My addresses</Link>
            <Link href="/account" className="block transition hover:text-[#f7f0e7]">My account</Link>
            <button onClick={() => session ? signOut() : toggleCart()} className="block text-left transition hover:text-[#f7f0e7]">{session ? "Sign out" : "Open shopping bag"}</button>
          </div>
        </nav>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#c6a15b]">The NOORÉ promise</p>
          <div className="mt-5 space-y-4">
            <div className="flex gap-3"><Truck className="mt-0.5 h-4 w-4 shrink-0 text-[#c6a15b]" /><div><p className="text-sm text-[#f0e8de]">Complimentary delivery</p><p className="mt-1 text-xs leading-5 text-[#918781]">On orders above PKR 5,000</p></div></div>
            <div className="flex gap-3"><Heart className="mt-0.5 h-4 w-4 shrink-0 text-[#c6a15b]" /><div><p className="text-sm text-[#f0e8de]">Cash on Delivery</p><p className="mt-1 text-xs leading-5 text-[#918781]">Available across Pakistan</p></div></div>
            <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 pt-1 text-xs font-semibold text-[#d6bd91] transition hover:text-white">Speak with our team <ArrowUpRight className="h-3.5 w-3.5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-5 text-[10px] text-[#827872] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {siteName}. All rights reserved.</span>
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1"><span>Designed with intention</span><span className="text-[#c6a15b]">✦</span><span>Cash on Delivery · Pakistan</span></span>
        </div>
      </div>
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
