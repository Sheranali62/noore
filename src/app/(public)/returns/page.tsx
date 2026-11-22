import Link from "next/link"
import { ArrowLeft, MessageCircle, RefreshCw } from "lucide-react"
import { SOCIAL_LINKS } from "@/config/social-links"

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-[#211b1d] text-[#f5f0e7]">
      <section className="border-b border-[#51423a] bg-[#171315] px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#c6a879] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to NOORÉ</Link>
          <p className="mt-9 text-[10px] font-semibold uppercase tracking-[.28em] text-[#c6a879]">Customer information</p>
          <h1 className="mt-4 font-editorial text-4xl sm:text-6xl">Returns & exchanges</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#b9ada5]">We want you to feel confident about your NOORÉ purchase. Please contact our team before sending an item back.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl space-y-5 px-5 py-12 sm:py-16">
        <article className="rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/[.07] p-6 sm:p-8">
          <RefreshCw className="h-6 w-6 text-[#c6a15b]" />
          <h2 className="mt-4 font-editorial text-2xl">7-day exchange window</h2>
          <p className="mt-3 text-sm leading-7 text-[#c4b8ae]">NOORÉ advertises a 7-day exchange policy. Please contact customer care within 7 days of receiving your order so our team can review your request and guide you through the next steps.</p>
        </article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8">
          <h2 className="font-editorial text-2xl">How to request an exchange</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-[#b9ada5]">
            <li>Message our customer care team within the 7-day window.</li>
            <li>Share your order number and the item you need help with.</li>
            <li>Wait for the team to confirm eligibility and provide return or exchange instructions before shipping anything.</li>
          </ol>
        </article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8">
          <h2 className="font-editorial text-2xl">Important information</h2>
          <p className="mt-3 text-sm leading-7 text-[#b9ada5]">Exchange eligibility, item condition requirements, exclusions and any applicable shipping costs must be confirmed by our customer care team for your specific order. Please do not dispatch an item until you have received instructions. This page does not promise a cash refund; contact us if your item arrived damaged, incorrect or incomplete so we can review it.</p>
        </article>
        <div className="flex flex-col gap-3 rounded-2xl border border-[#51423a] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-editorial text-xl">Start an exchange request</h2><p className="mt-1 text-xs text-[#a99d92]">Have your order reference ready.</p></div>
          <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c6a15b] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#171315]"><MessageCircle className="h-4 w-4" /> Contact customer care</a>
        </div>
      </section>
    </main>
  )
}