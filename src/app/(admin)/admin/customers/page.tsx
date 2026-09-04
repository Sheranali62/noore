import { prisma } from "@/lib/prisma"

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      orders: {
        select: { total: true, status: true }
      }
    }
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div><p className="text-xs uppercase tracking-[0.2em] text-secondary">Customer intelligence</p><h1 className="text-3xl font-semibold mt-2">Customers</h1></div>
      <a href="/api/admin/reports?type=customers" className="bg-charcoal text-white rounded-lg px-4 py-2 text-sm">Export CSV</a>
      </div>

      <div className="bg-white rounded-lg border border-cream overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-cream">
              <tr>
                <th className="text-left p-4 text-sm font-medium">Name</th>
                <th className="text-left p-4 text-sm font-medium">Email</th>
                <th className="text-left p-4 text-sm font-medium">Role</th>
                <th className="text-left p-4 text-sm font-medium">Orders</th>
                <th className="text-left p-4 text-sm font-medium">Total Spent</th>
                <th className="text-left p-4 text-sm font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-secondary">
                    No customers yet.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const totalSpent = customer.orders.reduce((sum, o) => sum + o.total, 0)
                  return (
                    <tr key={customer.id} className="border-t border-cream hover:bg-cream/50 transition">
                      <td className="p-4 font-medium">{customer.name || "N/A"}</td>
                      <td className="p-4">{customer.email}</td>
                      <td className="p-4">
                        <span className="px-2 py-1 rounded text-xs bg-gray-100">
                          {customer.role}
                        </span>
                      </td>
                      <td className="p-4">{customer.orders.length}</td>
                      <td className="p-4">PKR {totalSpent.toLocaleString()}</td>
                      <td className="p-4 text-secondary">{new Date(customer.createdAt).toLocaleDateString()}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}