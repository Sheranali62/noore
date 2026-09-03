"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Banner = {
  id: string
  heading: string
  subtitle: string | null
  image: string
  mobileImage: string | null
  video: string | null
  buttonText: string | null
  buttonUrl: string | null
}

export function HomepageHero({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)
  const active = banners[index]

  useEffect(() => {
    if (banners.length < 2) return
    const timer = setInterval(() => setIndex(current => (current + 1) % banners.length), 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  if (!active) {
    return (
      <section className="relative min-h-[68vh] md:min-h-[78vh] bg-neutral-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-black/10" />
        <div className="relative z-10 max-w-7xl mx-auto min-h-[68vh] md:min-h-[78vh] flex items-end px-5 md:px-8 pb-14 md:pb-20">
          <div className="max-w-xl">
            <p className="text-[10px] md:text-xs uppercase tracking-[.28em] text-white/70">NOORÉ EDIT</p>
            <h1 className="font-editorial text-4xl md:text-6xl lg:text-7xl leading-[.95] mt-4">The New Pakistani Wardrobe</h1>
            <p className="mt-5 text-sm md:text-base text-white/75 max-w-md">Curated silhouettes, festive edits and everyday essentials.</p>
            <Link href="/products" className="inline-flex mt-7 bg-white text-black px-7 py-3 text-xs font-semibold uppercase tracking-wider">Shop New Arrivals</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative min-h-[68vh] md:min-h-[78vh] overflow-hidden bg-neutral-100">
      <picture className="absolute inset-0">
        {active.mobileImage && <source media="(max-width: 767px)" srcSet={active.mobileImage} />}
        <img src={active.image} alt={active.heading} className="h-full w-full object-cover" />
      </picture>
      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
      <div className="relative z-10 max-w-7xl mx-auto min-h-[68vh] md:min-h-[78vh] flex items-end px-5 md:px-8 pb-14 md:pb-20 text-white">
        <div className="max-w-xl">
          <h1 className="font-editorial text-4xl md:text-6xl lg:text-7xl leading-[.95]">{active.heading}</h1>
          {active.subtitle && <p className="mt-5 text-sm md:text-base text-white/85 max-w-md">{active.subtitle}</p>}
          {active.buttonText && active.buttonUrl && <Link href={active.buttonUrl} className="inline-flex mt-7 bg-white text-black px-7 py-3 text-xs font-semibold uppercase tracking-wider">{active.buttonText}</Link>}
        </div>
      </div>
      {banners.length > 1 && <div className="absolute bottom-6 right-5 md:right-8 z-20 flex gap-2">{banners.map((banner, i) => <button key={banner.id} aria-label={`Go to slide ${i + 1}`} onClick={() => setIndex(i)} className={`h-1.5 transition-all ${i === index ? "w-10 bg-white" : "w-5 bg-white/50"}`} />)}</div>}
    </section>
  )
}
