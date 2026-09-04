import Link from "next/link"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/admin"
import AdminNav from "@/components/admin/admin-nav"

export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session } = await requireAdmin()
  if (!session) redirect("/login?callbackUrl=/admin")

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-64 bg-charcoal text-white p-6 min-h-screen sticky top-0">
        <div className="font-editorial text-2xl mb-8">NOORÉ Admin</div>
        <div className="text-xs text-white/60 mb-5 truncate">{session.user.email}</div>
        <AdminNav />
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
