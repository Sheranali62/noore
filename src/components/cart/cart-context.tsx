"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

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