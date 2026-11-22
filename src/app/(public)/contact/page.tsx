"use client"

import Link from "next/link"
import { MessageCircle, PackageSearch, ShoppingBag, ShieldCheck, Truck, ChevronRight } from "lucide-react"
import { SOCIAL_LINKS } from "@/config/social-links"

const helpItems = [
  {
    question: "How can I track my order?",
    answer: "Use your order number and the email address entered at checkout on our order-tracking page. You can also find your purchases in My Account.",
    href: "/order-tracking",
    link: "Track an order",
  },
  {
    question: "What payment method is available?",
    answer: "Cash on Delivery is available across Pakistan. Your order total is shown during checkout before you place the order.",
  },
  {
    question: "When is shipping free?",
    answer: "Standard free shipping applies to orders above PKR 5,000. Any applicable delivery charges are shown during checkout.",
  },
  {
    question: "Where can I see my previous purchases?",
    answer: "Sign in to your NOORÉ account and open My Orders to view your order history and access tracking.",
    href: "/account/orders",
    link: "View my orders",
  },
]

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#211b1d] text-[#f5f0e7]">
      <section className="relative overflow-hidden border-b border-[#51423a] bg-[#171315] px-5 pb-16 pt-16 sm:pb-20 sm:pt-20">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-[#c6a15b]/[.08] blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-[10px] font-semibold uppercase tracking-[.28em] text-[#c6a879]">NOORÉ customer care</p>
          <h1 className="mt-4 max-w-2xl font-editorial text-4xl leading-tight sm:text-6xl">Here to make every detail easier.</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#c2b8b0] sm:text-base">Need help with an order, delivery or your shopping experience? Our support team is one message away.</p>
          <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-xl bg-[#c6a15b] px-6 py-3 text-xs font-bold uppercase tracking-[.13em] text-[#171315] transition hover:bg-[#d8b978]">
            <MessageCircle className="h-4 w-4" /> Chat with us on WhatsApp <ChevronRight className="h-4 w-4" />
          </a>
          <p className="mt-3 text-[11px] text-[#a99d92]">For order-related enquiries, keep your order number ready.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-5 py-12 sm:grid-cols-3 sm:py-16">
        <Link href="/order-tracking" className="group rounded-2xl border border-[#51423a] bg-[#171315] p-6 transition hover:border-[#c6a15b]/70">
          <PackageSearch className="h-6 w-6 text-[#c6a15b]" />
          <h2 className="mt-5 font-editorial text-2xl">Track an order</h2>
          <p className="mt-2 text-sm leading-6 text-[#a99d92]">Check your order status with your order number and checkout email.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#d8bd8d]">Open tracking <ChevronRight className="h-3.5 w-3.5" /></span>
        </Link>
        <Link href="/account/orders" className="group rounded-2xl border border-[#51423a] bg-[#171315] p-6 transition hover:border-[#c6a15b]/70">
          <ShoppingBag className="h-6 w-6 text-[#c6a15b]" />
          <h2 className="mt-5 font-editorial text-2xl">My purchases</h2>
          <p className="mt-2 text-sm leading-6 text-[#a99d92]">Sign in to see your order history and purchase details.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#d8bd8d]">View my orders <ChevronRight className="h-3.5 w-3.5" /></span>
        </Link>
        <div className="rounded-2xl border border-[#51423a] bg-[#171315] p-6">
          <Truck className="h-6 w-6 text-[#c6a15b]" />
          <h2 className="mt-5 font-editorial text-2xl">Delivery details</h2>
          <p className="mt-2 text-sm leading-6 text-[#a99d92]">Free standard shipping on orders above PKR 5,000. Cash on Delivery is available across Pakistan.</p>
          <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#d8bd8d]"><ShieldCheck className="h-3.5 w-3.5" /> Secure order lookup</span>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16 sm:pb-24">
        <div className="border-b border-[#51423a] pb-5">
          <p className="text-[10px] font-semibold uppercase tracking-[.24em] text-[#c6a879]">Quick answers</p>
          <h2 className="mt-3 font-editorial text-3xl sm:text-4xl">Frequently asked questions</h2>
        </div>
        <div className="divide-y divide-[#51423a]">
          {helpItems.map((item) => (
            <article key={item.question} className="py-6">
              <h3 className="text-sm font-semibold text-[#f5f0e7]">{item.question}</h3>
              <p className="mt-2 text-sm leading-7 text-[#a99d92]">{item.answer}</p>
              {item.href && <Link href={item.href} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#d8bd8d] hover:text-[#f5dfba]">{item.link} <ChevronRight className="h-3.5 w-3.5" /></Link>}
            </article>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-[#b8945e]/30 bg-[#c6a15b]/[.07] p-6 sm:p-8">
          <h3 className="font-editorial text-2xl">Still need a hand?</h3>
          <p className="mt-2 text-sm leading-6 text-[#b9aa98]">Send our team a message on WhatsApp and include any relevant order details so we can help you more quickly.</p>
          <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-[#e3c58f] hover:text-white"><MessageCircle className="h-4 w-4" /> Contact customer care <ChevronRight className="h-4 w-4" /></a>
        </div>
      </section>
    </main>
  )
}
