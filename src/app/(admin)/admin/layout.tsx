import Link from "next/link"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin"
import AdminNav from "@/components/admin/admin-nav"
import MobileAdminNav from "@/components/admin/mobile-admin-nav"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = await requireAdmin()

  if (!session) {
    redirect("/login?callbackUrl=/admin")
  }

  const email = session.user.email ?? "Admin"

  return (
    <div className="admin-shell min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-charcoal p-6 text-white lg:block">
        <Link
          href="/admin"
          className="block border-b border-white/10 pb-6"
        >
          <div className="font-editorial text-3xl">
            NOORÉ
          </div>

          <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            Admin studio
          </div>
        </Link>

        <div className="mt-6 truncate text-xs text-white/45">
          {email}
        </div>

        <div className="mt-6">
          <AdminNav />
        </div>

        <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/50">
          Production workspace
          <br />
          <span className="text-white/75">
            COD commerce
          </span>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="sticky top-0 z-40 border-b border-white/10 bg-charcoal px-4 text-white shadow-lg lg:hidden">
          <MobileAdminNav email={email} />
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}