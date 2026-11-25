"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { useSession } from "next-auth/react"

type WishlistContextType = {
  items: string[]
  addItem: (id: string) => Promise<void>
  removeItem: (id: string) => Promise<void>
  toggleItem: (id: string) => Promise<void>
  isInWishlist: (id: string) => boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [items, setItems] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("noore_wishlist")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setItems(parsed.filter((value): value is string => typeof value === "string"))
      }
    } catch {
      setItems([])
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem("noore_wishlist", JSON.stringify(items))
  }, [items, hydrated])

  useEffect(() => {
    if (!hydrated || status === "loading") return
    const userId = session?.user?.id
    if (!userId) {
      return
    }

    let active = true
    const guestItems = items
    async function syncWishlist() {
      try {
        const response = await fetch("/api/wishlist", { cache: "no-store" })
        if (!response.ok) return
        const data = await response.json()
        const savedItems: string[] = Array.isArray(data.items)
          ? data.items.map((item: { productId: string }) => item.productId)
          : []
        const merged = Array.from(new Set([...savedItems, ...guestItems]))
        if (!active) return
        setItems(merged)

        const missing = guestItems.filter(id => !savedItems.includes(id))
        await Promise.all(missing.map(productId =>
          fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId }),
          })
        ))
      } catch (error) {
        console.error("Could not synchronize NOORÉ wishlist:", error)
      }
    }
    void syncWishlist()
    return () => { active = false }
  // Merge only when authentication state changes, not on each wishlist edit.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, status, session?.user?.id])

  const addItem = async (id: string) => {
    setItems(current => current.includes(id) ? current : [...current, id])
    if (session?.user) {
      await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      })
    }
  }

  const removeItem = async (id: string) => {
    setItems(current => current.filter(value => value !== id))
    if (session?.user) {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: id }),
      })
    }
  }

  const toggleItem = async (id: string) => {
    if (items.includes(id)) await removeItem(id)
    else await addItem(id)
  }

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, toggleItem, isInWishlist: id => items.includes(id) }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error("useWishlist must be used within WishlistProvider")
  return context
}
