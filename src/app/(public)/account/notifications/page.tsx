import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type ActivityItem = {
  id: string
  kind: "ORDER" | "RETURN" | "SUPPORT"
  title: string
  description: string
  date: Date
  href: string
}

function formatStatus(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default async function CustomerActivityPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/notifications")

  const userId = session.user.id
  const [orders, returns, replies] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: { id: true, orderNumber: true, status: true, createdAt: true, updatedAt: true },
    }),
    prisma.returnRequest.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 15,
      select: { id: true, reason: true, status: true, updatedAt: true, order: { select: { orderNumber: true } } },
    }),
    prisma.supportTicketMessage.findMany({
      where: { isStaff: true, ticket: { userId } },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, message: true, createdAt: true, ticket: { select: { id: true, subject: true } } },
    }),
  ])

  const activity: ActivityItem[] = [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      kind: "ORDER" as const,
      title: `Order #${order.orderNumber}`,
      description: `Current status: ${formatStatus(order.status)}`,
      date: order.updatedAt,
      href: `/account/orders/${order.id}`,
    })),
    ...returns.map((request) => ({
      id: `return-${request.id}`,
      kind: "RETURN" as const,
      title: `Return for order #${request.order.orderNumber}`,
      description: `${request.reason} · ${formatStatus(request.status)}`,
      date: request.updatedAt,
      href: "/account/returns",
    })),
    ...replies.map((reply) => ({
      id: `support-${reply.id}`,
      kind: "SUPPORT" as const,
      title: `Reply from NOORÉ Support · ${reply.ticket.subject}`,
      description: reply.message,
      date: reply.createdAt,
      href: "/account/support",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <main className="min-h-screen bg-[#F7F6F2] py-8 md:py-12">
      <div className="mx-auto max-w-4xl px-4">
        <Link href="/account" className="text-sm text-[#777967] hover:text-[#343A30]">← Back to account</Link>
        <header className="mt-6">
          <p className="text-xs uppercase tracking-[0.22em] text-[#777967]">Your account</p>
          <h1 className="mt-2 font-editorial text-4xl md:text-5xl">Updates & activity</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#777967]">A single place to follow order progress, return decisions and replies from our customer care team.</p>
        </header>

        {activity.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-[#D8D8CB] bg-white p-10 text-center">
            <div className="text-4xl">✧</div>
            <h2 className="mt-4 font-editorial text-2xl">You’re all caught up</h2>
            <p className="mt-2 text-sm text-[#777967]">New order, return and support updates will appear here.</p>
            <Link href="/products" className="mt-6 inline-flex rounded-xl bg-[#535F4C] px-5 py-3 text-sm font-semibold text-white">Explore the collection</Link>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-3xl border border-[#D8D8CB] bg-white">
            <div className="flex items-center justify-between border-b border-[#D8D8CB] px-5 py-4 md:px-7">
              <h2 className="font-semibold">Recent updates</h2>
              <span className="text-xs text-[#777967]">{activity.length} updates</span>
            </div>
            <ol className="divide-y divide-[#E7E5DC]">
              {activity.map((item) => (
                <li key={item.id}>
                  <Link href={item.href} className="flex gap-4 px-5 py-5 transition hover:bg-[#F7F6F2] md:px-7">
                    <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#EEEDE6] text-sm text-[#535F4C]" aria-hidden="true">
                      {item.kind === "ORDER" ? "□" : item.kind === "RETURN" ? "↺" : "✉"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-[#30352E]">{item.title}</span>
                        <time className="text-xs text-[#777967]" dateTime={item.date.toISOString()}>{item.date.toLocaleString()}</time>
                      </span>
                      <span className="mt-1 block whitespace-pre-wrap break-words text-sm leading-6 text-[#777967]">{item.description}</span>
                      <span className="mt-2 inline-block text-xs font-semibold text-[#535F4C]">View details →</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        )}
        <p className="mt-4 text-xs leading-5 text-[#777967]">This activity feed is private to your signed-in account. It refreshes when you revisit this page; email and push notifications are not enabled by this feature.</p>
      </div>
    </main>
  )
}
