"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type RecentItem = {
  id: string
  name: string
  slug: string
  image?: string
  price?: number
}

export default function NooreRecentlyViewed({
  current,
}: {
  current?: RecentItem
}) {
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    try {
      const key = "noore-recently-viewed"
      const saved = JSON.parse(localStorage.getItem(key) || "[]")
      const list = Array.isArray(saved) ? saved : []

      if (current?.id) {
        const next = [current, ...list.filter((x: RecentItem) => x?.id !== current.id)].slice(0, 6)
        localStorage.setItem(key, JSON.stringify(next))
        setItems(next.filter((x: RecentItem) => x?.id !== current.id).slice(0, 4))
      } else {
        setItems(list.slice(0, 4))
      }
    } catch {
      setItems([])
    }
  }, [current])

  if (!items.length) return null

  return (
    <section className="noore-modern mt-12 border-t border-[#ded3ce] pt-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-[#a06a5d]">
            NOORÉ / Your trail
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[#321526]">
            Recently viewed
          </h2>
        </div>
        <span className="hidden text-[8px] uppercase tracking-[0.18em] text-[#9b8780] sm:block">
          Pick up where you left off
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/product/${item.slug}`}
            className="noore-product-card bg-[#f4ebe4]"
          >
            {item.image ? (
              <div className="noore-product-image aspect-[4/5]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-[4/5] bg-[#e8ddd5]" />
            )}
            <div className="p-3">
              <p className="line-clamp-1 text-[9px] font-semibold text-[#321526]">
                {item.name}
              </p>
              {typeof item.price === "number" && (
                <p className="mt-1 text-[8px] text-[#806d67]">
                  PKR {item.price.toLocaleString("en-PK")}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
