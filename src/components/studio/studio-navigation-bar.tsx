"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Item = { id: string; label: string; url: string; sortOrder: number }

export default function StudioNavigationBar() {
  const [items, setItems] = useState<Item[]>([])
  useEffect(() => {
    let active = true
    fetch("/api/studio/navigation", { cache: "no-store" }).then(response => response.ok ? response.json() : null)
      .then(data => { if (active && Array.isArray(data?.items)) setItems(data.items) })
      .catch(() => {})
    return () => { active = false }
  }, [])
  if (!items.length) return null
  return <nav aria-label="Additional store navigation" className="border-b border-black/5 bg-[#f7f6f2] text-[#30352e]">
    <div className="mx-auto flex max-w-7xl items-center justify-center gap-5 overflow-x-auto px-5 py-3 sm:gap-8">
      {items.map(item => <Link key={item.id} href={item.url} className="shrink-0 text-[9px] font-semibold uppercase tracking-[.18em] text-current/70 transition hover:text-[#9b7542]">{item.label}</Link>)}
    </div>
  </nav>
}
