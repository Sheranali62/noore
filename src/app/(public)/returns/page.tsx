import Link from "next/link"
import { ArrowLeft, MessageCircle, RefreshCw } from "lucide-react"
import { SOCIAL_LINKS } from "@/config/social-links"

export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-[#F7F6F2] text-[#333A30]">
      <section className="border-b border-[#D8D5CA] bg-[#535F4C] px-5 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#535F4C] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to NOORÉ</Link>
          <p className="mt-9 text-[10px] font-semibold uppercase tracking-[.28em] text-[#535F4C]">Customer information</p>
          <h1 className="mt-4 font-editorial text-4xl sm:text-6xl">Returns & exchanges</h1>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-[#6F756A]">We want you to feel confident about your NOORÉ purchase. Please contact our team before sending an item back.</p>
        </div>
      </section>
      <section className="mx-auto max-w-4xl space-y-5 px-5 py-12 sm:py-16">
        <article className="rounded-2xl border border-[#C2C5B0] bg-[#535F4C]/[.07] p-6 sm:p-8">
          <RefreshCw className="h-6 w-6 text-[#c6a15b]" />
          <h2 className="mt-4 font-editorial text-2xl">7-day exchange window</h2>
          <p className="mt-3 text-sm leading-7 text-[#6F756A]">NOORÉ advertises a 7-day exchange policy. Please contact customer care within 7 days of receiving your order so our team can review your request and guide you through the next steps.</p>
        </article>
        <article className="rounded-2xl border border-[#D8D5CA] bg-[#535F4C] p-6 sm:p-8">
          <h2 className="font-editorial text-2xl">How to request an exchange</h2>
          <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-[#6F756A]">
            <li>Message our customer care team within the 7-day window.</li>
            <li>Share your order number and the item you need help with.</li>
            <li>Wait for the team to confirm eligibility and provide return or exchange instructions before shipping anything.</li>
          </ol>
        </article>
        <article className="rounded-2xl border border-[#D8D5CA] bg-[#535F4C] p-6 sm:p-8">
          <h2 className="font-editorial text-2xl">Important information</h2>
          <p className="mt-3 text-sm leading-7 text-[#6F756A]">Exchange eligibility, item condition requirements, exclusions and any applicable shipping costs must be confirmed by our customer care team for your specific order. Please do not dispatch an item until you have received instructions. This page does not promise a cash refund; contact us if your item arrived damaged, incorrect or incomplete so we can review it.</p>
        </article>
        <div className="flex flex-col gap-3 rounded-2xl border border-[#D8D5CA] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-editorial text-xl">Already received your order?</h2><p className="mt-1 text-xs text-[#6F756A]">Submit an exchange or item-issue request from your NOORÉ account within the advertised 7-day window.</p></div>
          <Link href="/account/returns" className="inline-flex items-center justify-center rounded-lg bg-[#535F4C] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#F7F6F2]">Open exchange requests</Link>
        </div>
        <div className="flex flex-col gap-3 rounded-2xl border border-[#D8D5CA] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div><h2 className="font-editorial text-xl">Start an exchange request</h2><p className="mt-1 text-xs text-[#6F756A]">Have your order reference ready.</p></div>
          <a href={SOCIAL_LINKS.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#535F4C] px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#F7F6F2]"><MessageCircle className="h-4 w-4" /> Contact customer care</a>
        </div>
      </section>
    </main>
  )
}