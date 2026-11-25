import Link from "next/link"
import { redirect } from "next/navigation"
import { Search, ShieldCheck } from "lucide-react"
import { requireAdmin } from "@/lib/admin"
import AdminNav from "@/components/admin/admin-nav"
import MobileAdminNav from "@/components/admin/mobile-admin-nav"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireAdmin()
  if (!session) redirect("/login?callbackUrl=/admin")

  const email = session.user.email ?? "Admin"
  const role = session.user.role ?? "CUSTOMER"
  const displayName = session.user.name || email.split("@")[0] || "Admin"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen bg-[#0c0c0b] text-white">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-[#d6ae72]/25 bg-[#090909] px-5 py-6 lg:flex lg:flex-col">
        <Link href="/admin" className="border-b border-white/10 px-2 pb-6">
          <div className="font-editorial text-[38px] leading-none tracking-wide text-[#e8c98e]">NOORÉ</div>
          <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.34em] text-[#d6ae72]/70">Fashion · Style · You</div>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#d6ae72]/25 bg-[#d6ae72]/10 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#e4c28e]"><ShieldCheck className="h-3 w-3" /> Admin studio</div>
        </Link>
        <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1"><AdminNav role={role} /></div>
        <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.035] p-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">Signed in as</p>
          <p className="mt-2 truncate text-xs font-medium text-white/80">{email}</p>
          <p className="mt-1 text-[10px] text-[#d6ae72]">Production workspace</p>
        </div>
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 border-b border-[#d6ae72]/20 bg-[#0c0c0b]/95 px-4 shadow-[0_8px_30px_rgba(0,0,0,.2)] backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-h-[72px] items-center justify-between gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-3 lg:max-w-[520px]">
              <div className="lg:hidden"><MobileAdminNav email={email} role={role} /></div>
              <div className="hidden h-11 w-full items-center gap-3 rounded-full border border-white/10 bg-white/[0.055] px-4 text-sm text-white/35 sm:flex"><Search className="h-4 w-4" /><span>NOORÉ administration</span></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block"><p className="max-w-[180px] truncate text-xs font-semibold text-white">{displayName}</p><p className="text-[10px] text-white/40">Super Admin</p></div>
              <div className="grid h-10 w-10 place-items-center rounded-full border border-[#e4c28e]/50 bg-[#d6ae72] text-xs font-bold text-[#21180d]">{initials}</div>
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-72px)] bg-[radial-gradient(ellipse_at_top_left,rgba(214,174,114,.055),transparent_35%),#0c0c0b] p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
