"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type WishlistContextType = {
  items: number[]
  addItem: (productId: number) => void
  removeItem: (productId: number) => void
  toggleItem: (productId: number) => void
  isInWishlist: (productId: number) => boolean
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<number[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("noore_wishlist")
    if (stored) {
      try {
        setItems(JSON.parse(stored))
      } catch {
        setItems([])
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("noore_wishlist", JSON.stringify(items))
  }, [items])

  const addItem = (productId: number) => {
    setItems(prev => [...prev, productId])
  }

  const removeItem = (productId: number) => {
    setItems(prev => prev.filter(id => id !== productId))
  }

  const toggleItem = (productId: number) => {
    if (items.includes(productId)) {
      removeItem(productId)
    } else {
      addItem(productId)
    }
  }

  const isInWishlist = (productId: number) => {
    return items.includes(productId)
  }

  return (
    <WishlistContext.Provider value={{ items, addItem, removeItem, toggleItem, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const context = useContext(WishlistContext)
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider")
  }
  return context
}