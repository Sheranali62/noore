import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const cards = [
  { href: "/account/orders", icon: "□", title: "Orders", text: "View purchases and follow delivery" },
  { href: "/account/profile", icon: "○", title: "Profile", text: "Update your name and email" },
  { href: "/account/addresses", icon: "⌂", title: "Addresses", text: "Manage your COD delivery details" },
  { href: "/wishlist", icon: "♡", title: "Wishlist", text: "Return to pieces you love" },
]

const statusClass = (status: string) => {
  if (status === "DELIVERED") return "bg-green-100 text-green-800"
  if (status === "CANCELLED" || status === "REFUNDED") return "bg-red-100 text-red-800"
  if (status === "SHIPPED" || status === "OUT_FOR_DELIVERY") return "bg-blue-100 text-blue-800"
  return "bg-amber-100 text-amber-800"
}

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login?callbackUrl=/account")

  const [user, orderCount, wishlist, spend, activeOrders, recent] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.order.count({ where: { userId: session.user.id } }),
    prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      select: { _count: { select: { items: true } } },
    }),
    prisma.order.aggregate({
      where: { userId: session.user.id, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: {
        userId: session.user.id,
        status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY"] },
      },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, orderNumber: true, total: true, status: true, createdAt: true, paymentStatus: true },
    }),
  ])

  if (!user) redirect("/login")

  return (
    <div className="min-h-screen bg-cream py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4">
        <section className="relative overflow-hidden rounded-[2rem] bg-charcoal text-white p-7 md:p-10">
          <div className="relative z-10 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-white/55">NOORÉ member</p>
            <h1 className="font-editorial text-4xl md:text-5xl mt-2 leading-tight">
              Welcome back, {user.name || "Customer"}.
            </h1>
            <p className="text-white/65 mt-3 max-w-xl">
              Your orders, saved pieces and delivery details — beautifully kept in one place.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <Link href="/products" className="bg-white text-charcoal rounded-xl px-5 py-3 text-sm font-semibold hover:bg-white/90">
                Continue shopping
              </Link>
              {activeOrders > 0 && (
                <Link href="/account/orders" className="border border-white/25 rounded-xl px-5 py-3 text-sm hover:bg-white/10">
                  Track active order
                </Link>
              )}
            </div>
          </div>
          <div className="absolute -right-16 -bottom-28 w-72 h-72 rounded-full border border-white/10" />
          <div className="absolute right-16 -top-24 w-48 h-48 rounded-full border border-white/10" />
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mt-5">
          {[
            ["Orders", String(orderCount)],
            ["Wishlist", String(wishlist?._count.items || 0)],
            ["Active", String(activeOrders)],
            ["Lifetime spend", `PKR ${Math.round(spend._sum.total || 0).toLocaleString()}`],
            ["Member since", new Date(user.createdAt).toLocaleDateString()],
          ].map(([label, value]) => (
            <div key={label} className="bg-white border border-cream rounded-2xl p-4 md:p-5">
              <p className="text-[10px] md:text-xs uppercase tracking-[0.16em] text-secondary">{label}</p>
              <p className="text-lg md:text-2xl font-semibold mt-2 truncate">{value}</p>
            </div>
          ))}
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {cards.map((card) => (
            <Link key={card.href} href={card.href} className="group bg-white border border-cream rounded-2xl p-6 hover:-translate-y-0.5 hover:shadow-xl transition">
              <div className="text-3xl text-charcoal/70">{card.icon}</div>
              <h2 className="font-semibold mt-5">{card.title}</h2>
              <p className="text-sm text-secondary mt-1">{card.text}</p>
              <span className="inline-block mt-5 text-sm font-medium group-hover:underline">Open →</span>
            </Link>
          ))}
        </section>

        <section className="bg-white border border-cream rounded-2xl mt-8 p-6 md:p-8">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-secondary">Latest activity</p>
              <h2 className="font-editorial text-2xl md:text-3xl mt-1">Recent orders</h2>
            </div>
            <Link href="/account/orders" className="text-sm font-medium hover:underline">View all orders →</Link>
          </div>

          {recent.length === 0 ? (
            <div className="mt-7 rounded-2xl bg-cream/60 p-8 text-center">
              <p className="font-editorial text-2xl">Your NOORÉ story starts here.</p>
              <p className="text-sm text-secondary mt-2">No purchases yet. Explore the collection when you&apos;re ready.</p>
              <Link href="/products" className="inline-flex mt-5 bg-charcoal text-white rounded-xl px-5 py-3 text-sm font-semibold">Explore the collection</Link>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-cream">
              {recent.map((order) => (
                <Link href={`/account/orders/${order.id}`} key={order.id} className="py-4 first:pt-0 last:pb-0 flex flex-wrap justify-between items-center gap-4 hover:bg-cream/30">
                  <div>
                    <p className="font-medium">#{order.orderNumber}</p>
                    <p className="text-xs text-secondary mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-3 py-1 text-[10px] uppercase tracking-wide font-medium ${statusClass(order.status)}`}>
                      {order.status.replaceAll("_", " ")}
                    </span>
                    <p className="font-semibold">PKR {order.total.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
