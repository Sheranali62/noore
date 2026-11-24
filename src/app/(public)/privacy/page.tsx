import Link from "next/link"
import { ArrowLeft, LockKeyhole } from "lucide-react"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F7F6F2] text-[#333A30]">
      <section className="border-b border-[#D8D5CA] bg-[#535F4C] px-5 py-16 sm:py-20"><div className="mx-auto max-w-4xl">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#535F4C] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Back to NOORÉ</Link>
        <p className="mt-9 text-[10px] font-semibold uppercase tracking-[.28em] text-[#535F4C]">Your information</p>
        <h1 className="mt-4 font-editorial text-4xl sm:text-6xl">Privacy policy</h1>
        <p className="mt-5 text-sm leading-7 text-[#6F756A]">This notice explains how information submitted through the NOORÉ store is used to provide shopping and customer support services.</p>
      </div></section>
      <section className="mx-auto max-w-4xl space-y-5 px-5 py-12 sm:py-16">
        <article className="rounded-2xl border border-[#C2C5B0] bg-[#535F4C]/[.07] p-6 sm:p-8"><LockKeyhole className="h-6 w-6 text-[#c6a15b]" /><h2 className="mt-4 font-editorial text-2xl">Information you provide</h2><p className="mt-3 text-sm leading-7 text-[#6F756A]">When you create an account, place an order or contact us, you may provide details such as your name, email address, phone number, delivery address and order information.</p></article>
        <article className="rounded-2xl border border-[#D8D5CA] bg-[#535F4C] p-6 sm:p-8"><h2 className="font-editorial text-2xl">How information is used</h2><p className="mt-3 text-sm leading-7 text-[#6F756A]">We use submitted information to process and fulfil orders, provide order updates, support customer accounts, respond to enquiries, and maintain store operations. Information may be processed by service providers that help operate the website, authentication, hosting and order services.</p></article>
        <article className="rounded-2xl border border-[#D8D5CA] bg-[#535F4C] p-6 sm:p-8"><h2 className="font-editorial text-2xl">Payments and security</h2><p className="mt-3 text-sm leading-7 text-[#6F756A]">Available payment options are presented at checkout. Do not send passwords or sensitive payment credentials through WhatsApp, email or social messages. Use the website's account and checkout screens for their intended purpose.</p></article>
        <article className="rounded-2xl border border-[#D8D5CA] bg-[#535F4C] p-6 sm:p-8"><h2 className="font-editorial text-2xl">Your choices and questions</h2><p className="mt-3 text-sm leading-7 text-[#6F756A]">If you need to correct account details or have a question about information associated with an order, contact customer care and provide enough information for us to locate the request. We may need to retain transaction records where required for legitimate business or legal purposes.</p><Link href="/contact" className="mt-4 inline-flex text-xs font-semibold uppercase tracking-wider text-[#535F4C] hover:text-white">Contact customer care ↗</Link></article>
        <p className="text-xs leading-6 text-[#777D72]">This is a general store privacy notice, not legal advice. The store owner should review it against the actual data practices, service providers and applicable legal requirements before treating it as a final legal policy.</p>
      </section>
    </main>
  )
}