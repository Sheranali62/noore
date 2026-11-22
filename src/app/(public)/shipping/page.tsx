import Link from "next/link"
import { ArrowLeft, MessageCircle, PackageCheck, Truck } from "lucide-react"
import { SOCIAL_LINKS } from "@/config/social-links"

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-[#211b1d] text-[#f5f0e7]">
      <section className="border-b border-[#51423a] bg-[#171315] px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#c6a879] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to NOORÉ</Link>
          <p className="mt-9 text-[10px] font-semibold uppercase tracking-[.28em] text-[#c6a879]">Customer information</p>
          <h1 className="mt-4 font-editorial text-4xl sm:text-6xl">Shipping information</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#b9ada5]">Everything you need to know about delivery for your NOORÉ order.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl space-y-5 px-5 py-12 sm:py-16">
        <article className="rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/[.07] p-6 sm:p-8">
          <Truck className="h-6 w-6 text-[#c6a15b]" />
          <h2 className="mt-4 font-editorial text-2xl">Complimentary standard delivery</h2>
          <p className="mt-3 text-sm leading-7 text-[#c4b8ae]">Standard shipping is free on orders above PKR 5,000. For orders below this amount, the applicable delivery charge is displayed at checkout before you confirm your purchase.</p>
        </article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8">
          <PackageCheck className="h-6 w-6 text-[#c6a15b]" />
          <h2 className="mt-4 font-editorial text-2xl">Order processing and tracking</h2>
          <p className="mt-3 text-sm leading-7 text-[#b9ada5]">After placing an order, keep your order reference for support and tracking. You can check available status updates through our order tracking page or your NOORÉ account. Delivery estimates, where available, are shown during the order process or shared by our team.</p>
          <Link href="/order-tracking" className="mt-5 inline-flex text-xs font-semibold uppercase tracking-[.12em] text-[#d8bd8d] hover:text-white">Track your order <span className="ml-2">↗</span></Link>
        </article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8">
          <h2 className="font-editorial text-2xl">Delivery charges</h2>
          <p className="mt-3 text-sm leading-7 text-[#b9ada5]">Any standard or express delivery fee applicable to your order is calculated and shown at checkout. Please review the final order summary before placing your order.</p>
        </article>
        <div className="flex flex-col gap-3 rounded-2xl border border-[#51423a] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-editorial text-xl">Need help with delivery?</h2><p className="mt-1 text-xs text-[#a99d92]">Contact our customer care team with your order number.</p></div>
          <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a15b] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#171315]"><MessageCircle className="h-4 w-4" /> WhatsApp support</a>
        </div>
      </section>
    </main>
  )
}