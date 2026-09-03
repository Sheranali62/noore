"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

type Banner = { id: string; heading: string; subtitle: string | null; image: string; mobileImage: string | null; video: string | null; buttonText: string | null; buttonUrl: string | null }

export function HeroSlider({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (banners.length < 2) return
    const timer = window.setInterval(() => setIndex(current => (current + 1) % banners.length), 5000)
    return () => window.clearInterval(timer)
  }, [banners.length])
  if (!banners.length) return null
  const banner = banners[index]
  return <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center bg-charcoal text-white overflow-hidden">
    <picture className="absolute inset-0">
      {banner.mobileImage && <source media="(max-width: 767px)" srcSet={banner.mobileImage} />}
      <img src={banner.image} alt="" className="w-full h-full object-cover opacity-75" />
    </picture>
    <div className="absolute inset-0 bg-black/35" />
    <div className="relative z-10 text-center px-4 max-w-4xl py-24">
      <span className="text-xs uppercase tracking-[0.2em] font-light opacity-80">NOORÉ</span>
      <h1 className="font-editorial text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight mt-4">{banner.heading}</h1>
      {banner.subtitle && <p className="text-base md:text-lg font-light mt-4 opacity-90 max-w-xl mx-auto">{banner.subtitle}</p>}
      {banner.buttonText && banner.buttonUrl && <Link href={banner.buttonUrl} className="inline-block mt-8 bg-white text-charcoal px-8 py-3 rounded-md font-medium hover:bg-cream transition-all">{banner.buttonText}</Link>}
    </div>
    {banners.length > 1 && <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">{banners.map((item, dot) => <button key={item.id} aria-label={`Go to slide ${dot + 1}`} onClick={() => setIndex(dot)} className={`w-2.5 h-2.5 rounded-full ${dot === index ? "bg-white" : "bg-white/40"}`} />)}</div>}
  </section>
}
