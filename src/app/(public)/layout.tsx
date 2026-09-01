"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useCart } from "@/components/cart/cart-context"
import { CartDrawer } from "@/components/cart/cart-drawer"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const { count, toggleCart } = useCart()

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-charcoal text-white text-center text-xs py-2 tracking-wider">
        FREE SHIPPING ON ORDERS ABOVE PKR 5,000
      </div>
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-cream/90 backdrop-blur border-b border-cream">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-editorial text-2xl font-semibold hover:opacity-70 transition">
            NOORÉ
          </Link>
          
          <nav className="hidden md:flex gap-6 text-sm">
            <Link href="/products" className="hover:text-secondary transition">Shop All</Link>
            <Link href="/products?category=Women" className="hover:text-secondary transition">Women</Link>
            <Link href="/products?category=Luxury" className="hover:text-secondary transition">Luxury</Link>
            <Link href="/products?category=Men" className="hover:text-secondary transition">Men</Link>
            <Link href="/products?category=Accessories" className="hover:text-secondary transition">Accessories</Link>
          </nav>
          
          <div className="flex items-center gap-4 text-lg">
            <button className="hover:text-secondary transition">🔍</button>
            
            {/* Auth Links */}
            {session ? (
              <div className="flex items-center gap-3">
                <Link href="/account" className="hover:text-secondary transition text-sm">
                  {session.user?.name || "Account"}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-secondary hover:text-charcoal transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-sm hover:text-secondary transition">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm bg-charcoal text-white px-3 py-1 rounded hover:bg-charcoal/80 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}
            
            <button className="hover:text-secondary transition">❤️</button>
            <button 
              onClick={toggleCart} 
              className="hover:text-secondary transition relative"
            >
              🛒
              {count > 0 && (
                <span className="absolute -top-1 -right-2 bg-charcoal text-white text-[0.55rem] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-charcoal text-white/80 border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="font-editorial text-2xl font-semibold text-white mb-4">NOORÉ</div>
          <p className="text-sm text-white/60 max-w-md mx-auto">
            Premium Pakistani fashion for the modern wardrobe. Timeless elegance, contemporary expression.
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="#" className="text-white/50 hover:text-white transition">Instagram</a>
            <a href="#" className="text-white/50 hover:text-white transition">Facebook</a>
            <a href="#" className="text-white/50 hover:text-white transition">YouTube</a>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-xs text-white/40">
            © 2026 NOORÉ. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  )
}