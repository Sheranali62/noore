"use client"

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react"
import { useSession } from "next-auth/react"

export type CartItem = {
  id: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  slug: string
  variantId?: string
  variantLabel?: string
}

type CartContextType = {
  items: CartItem[]
  hydrated: boolean
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

function cartKey(item: Pick<CartItem, "productId" | "variantId">) {
  return `${item.productId}:${item.variantId || "default"}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { data: session, status: sessionStatus } = useSession()
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [remoteReady, setRemoteReady] = useState(false)
  const remoteUserId = useRef<string | null>(null)

  // Restore the guest cart before allowing any writes to localStorage.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("noore_cart")
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setItems(parsed)
      }
    } catch {
      // Keep an empty cart if stored data is malformed or unavailable.
    } finally {
      setHydrated(true)
    }
  }, [])

  // A signed-in customer's database cart is merged with the guest cart.
  // Matching quantities use the larger value to avoid duplicating the same cart
  // when a browser refreshes after a successful sync.
  useEffect(() => {
    if (!hydrated || sessionStatus === "loading") return
    const userId = session?.user?.id
    if (sessionStatus !== "authenticated" || !userId) {
      remoteUserId.current = null
      setRemoteReady(false)
      return
    }
    if (remoteUserId.current === userId) return

    remoteUserId.current = userId
    setRemoteReady(false)
    let active = true

    fetch("/api/cart", { cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw new Error("Saved cart could not be loaded")
        return response.json()
      })
      .then(data => {
        if (!active || !Array.isArray(data.items)) return
        setItems(current => {
          const merged = new Map<string, CartItem>()
          for (const item of [...current, ...data.items]) {
            if (!item?.productId) continue
            const key = cartKey(item)
            const previous = merged.get(key)
            merged.set(key, previous
              ? { ...previous, ...item, quantity: Math.max(previous.quantity, item.quantity) }
              : { ...item, id: key })
          }
          return Array.from(merged.values())
        })
        setRemoteReady(true)
      })
      .catch(error => {
        console.error("NOORÉ saved cart sync failed:", error)
        // Do not overwrite the server cart if it could not be read.
      })

    return () => { active = false }
  }, [hydrated, sessionStatus, session?.user?.id])

  // Keep local storage available for guest checkout and offline browsing.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem("noore_cart", JSON.stringify(items))
    } catch {
      // Cart remains usable for the current session if storage is unavailable.
    }
  }, [items, hydrated])

  // Persist authenticated cart changes after the initial server merge.
  useEffect(() => {
    if (!hydrated || !remoteReady || sessionStatus !== "authenticated" || !session?.user?.id) return
    const timer = window.setTimeout(() => {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || null,
            quantity: item.quantity,
          })),
        }),
      }).then(response => {
        if (!response.ok) return response.json().then(data => {
          console.error("NOORÉ saved cart update rejected:", data.error || response.status)
        })
      }).catch(error => console.error("NOORÉ saved cart update failed:", error))
    }, 350)
    return () => window.clearTimeout(timer)
  }, [items, hydrated, remoteReady, sessionStatus, session?.user?.id])

  const addItem = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
    setIsOpen(true)
  }

  const removeItem = (itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(itemId)
      return
    }
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i))
  }

  const clearCart = () => setItems([])
  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const toggleCart = () => setIsOpen(prev => !prev)

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items,
      hydrated,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      total,
      count,
      isOpen,
      openCart,
      closeCart,
      toggleCart,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
