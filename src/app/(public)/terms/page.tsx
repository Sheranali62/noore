import Link from "next/link"
import { ArrowLeft, ShoppingBag } from "lucide-react"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#211b1d] text-[#f5f0e7]">
      <section className="border-b border-[#51423a] bg-[#171315] px-5 py-16 sm:py-20"><div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#c6a879] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to NOORÉ</Link>
        <p className="mt-9 text-[10px] font-semibold uppercase tracking-[.28em] text-[#c6a879]">Store information</p>
        <h1 className="mt-4 font-editorial text-4xl sm:text-6xl">Terms & conditions</h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-[#b9ada5]">These terms describe the basic expectations for using the NOORÉ online store and placing an order.</p>
      </div></section>
      <section className="mx-auto max-w-4xl space-y-5 px-5 py-12 sm:py-16">
        <article className="rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/[.07] p-6 sm:p-8"><ShoppingBag className="h-6 w-6 text-[#c6a15b]" /><h2 className="mt-4 font-editorial text-2xl">Orders and product information</h2><p className="mt-3 text-sm leading-7 text-[#c4b8ae]">Please review product descriptions, available sizes, colours, quantities, delivery details and the order total before placing an order. Product availability and displayed information may change. An order request is subject to confirmation by NOORÉ.</p></article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8"><h2 className="font-editorial text-2xl">Pricing and payment</h2><p className="mt-3 text-sm leading-7 text-[#b9ada5]">Prices are displayed in Pakistani Rupees (PKR) unless stated otherwise. The final amount, including any delivery charge or discount, is shown at checkout before you submit the order. Payment methods available for a particular order are shown during checkout.</p></article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8"><h2 className="font-editorial text-2xl">Delivery, exchanges and support</h2><p className="mt-3 text-sm leading-7 text-[#b9ada5]">Delivery details are described in our <Link href="/shipping" className="text-[#d8bd8d] underline underline-offset-4">shipping information</Link>. Exchange requests are handled under our <Link href="/returns" className="text-[#d8bd8d] underline underline-offset-4">returns and exchanges information</Link>. Contact customer care if an order is incorrect, damaged or delayed.</p></article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8"><h2 className="font-editorial text-2xl">Acceptable use</h2><p className="mt-3 text-sm leading-7 text-[#b9ada5]">Please use the store lawfully and provide accurate information when creating an account or placing an order. Do not attempt to interfere with website security, misuse another customer's account or submit fraudulent orders.</p></article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8"><h2 className="font-editorial text-2xl">Questions</h2><p className="mt-3 text-sm leading-7 text-[#b9ada5]">For questions about these terms or an existing purchase, contact our customer care team.</p><Link href="/contact" className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-[#d8bd8d] hover:text-white">Contact NOORÉ ↗</Link></article>
        <p className="text-xs leading-6 text-[#8f837c]">These are general storefront terms and should be reviewed by the store owner or legal adviser for local legal compliance before being treated as final legal terms.</p>
      </section>
    </main>
  )
}