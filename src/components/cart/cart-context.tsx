"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { data: session, status: sessionStatus } = useSession()
  const [syncedUserId, setSyncedUserId] = useState<string | null>(null)

  // Restore the saved cart before allowing any writes to localStorage.
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

  // When a customer signs in, merge their guest cart with the saved account cart.
  useEffect(() => {
    if (!hydrated || sessionStatus === "loading") return
    const userId = session?.user?.id
    if (!userId) {
      setSyncedUserId(null)
      return
    }

    let active = true
    const guestItems = items
    async function syncOnSignIn() {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" })
        if (!response.ok) return
        const data = await response.json()
        const savedItems: CartItem[] = Array.isArray(data.items) ? data.items : []
        const merged = new Map<string, CartItem>()

        for (const item of savedItems) merged.set(item.id, item)
        for (const item of guestItems) {
          const existing = merged.get(item.id)
          const stock = Number((existing as any)?.stock ?? (item as any).stock ?? 99)
          merged.set(item.id, {
            ...item,
            quantity: Math.min(stock, (existing?.quantity ?? 0) + item.quantity),
          })
        }

        if (!active) return
        const nextItems = Array.from(merged.values()).filter(item => item.quantity > 0)
        setItems(nextItems)
        setSyncedUserId(userId)
      } catch (error) {
        console.error("Could not restore the saved NOORÉ cart:", error)
      }
    }

    void syncOnSignIn()
    return () => { active = false }
  // Only run this merge when the authenticated account changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, sessionStatus, session?.user?.id])

  // Persist every subsequent cart change for signed-in customers.
  useEffect(() => {
    if (!syncedUserId || syncedUserId !== session?.user?.id || !hydrated) return
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
    }).then(async response => {
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.warn("NOORÉ cart sync:", data.error || response.statusText)
      }
    }).catch(error => console.error("NOORÉ cart sync failed:", error))
  }, [items, syncedUserId, session?.user?.id, hydrated])

  // Do not overwrite the saved cart with the initial empty state before hydration.
  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem("noore_cart", JSON.stringify(items))
    } catch {
      // Cart remains usable for the current session if storage is unavailable.
    }
  }, [items, hydrated])

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
    setIsOpen(true) // Open cart drawer when adding
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