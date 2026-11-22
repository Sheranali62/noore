import Link from "next/link"
import { ArrowLeft, LockKeyhole } from "lucide-react"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#211b1d] text-[#f5f0e7]">
      <section className="border-b border-[#51423a] bg-[#171315] px-5 py-16 sm:py-20"><div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#c6a879] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to NOORÉ</Link>
        <p className="mt-9 text-[10px] font-semibold uppercase tracking-[.28em] text-[#c6a879]">Your information</p>
        <h1 className="mt-4 font-editorial text-4xl sm:text-6xl">Privacy policy</h1>
        <p className="mt-5 text-sm leading-7 text-[#b9ada5]">This notice explains how information submitted through the NOORÉ store is used to provide shopping and customer support services.</p>
      </div></section>
      <section className="mx-auto max-w-4xl space-y-5 px-5 py-12 sm:py-16">
        <article className="rounded-2xl border border-[#c6a15b]/30 bg-[#c6a15b]/[.07] p-6 sm:p-8"><LockKeyhole className="h-6 w-6 text-[#c6a15b]" /><h2 className="mt-4 font-editorial text-2xl">Information you provide</h2><p className="mt-3 text-sm leading-7 text-[#c4b8ae]">When you create an account, place an order or contact us, you may provide details such as your name, email address, phone number, delivery address and order information.</p></article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8"><h2 className="font-editorial text-2xl">How information is used</h2><p className="mt-3 text-sm leading-7 text-[#b9ada5]">We use submitted information to process and fulfil orders, provide order updates, support customer accounts, respond to enquiries, and maintain store operations. Information may be processed by service providers that help operate the website, authentication, hosting and order services.</p></article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8"><h2 className="font-editorial text-2xl">Payments and security</h2><p className="mt-3 text-sm leading-7 text-[#b9ada5]">Available payment options are presented at checkout. Do not send passwords or sensitive payment credentials through WhatsApp, email or social messages. Use the website's account and checkout screens for their intended purpose.</p></article>
        <article className="rounded-2xl border border-[#51423a] bg-[#171315] p-6 sm:p-8"><h2 className="font-editorial text-2xl">Your choices and questions</h2><p className="mt-3 text-sm leading-7 text-[#b9ada5]">If you need to correct account details or have a question about information associated with an order, contact customer care and provide enough information for us to locate the request. We may need to retain transaction records where required for legitimate business or legal purposes.</p><Link href="/contact" className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-[#d8bd8d] hover:text-white">Contact customer care ↗</Link></article>
        <p className="text-xs leading-6 text-[#8f837c]">This is a general store privacy notice, not legal advice. The store owner should review it against the actual data practices, service providers and applicable legal requirements before treating it as a final legal policy.</p>
      </section>
    </main>
  )
}