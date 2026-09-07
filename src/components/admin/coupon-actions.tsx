"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export function CouponActions({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const update = async (method: "PATCH" | "DELETE", action: string) => {
    if (method === "DELETE" && !confirm("Delete this coupon? Coupons with usage history will be deactivated instead.")) return
    setLoading(true)
    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "PATCH" ? JSON.stringify({ active: !active }) : undefined,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || `Unable to ${action} coupon`)
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : `Unable to ${action} coupon`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`/admin/coupons/edit/${id}`} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/75 hover:bg-white/[0.07]">Edit</a>
      <button type="button" disabled={loading} onClick={() => update("PATCH", active ? "deactivate" : "activate")} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/75 hover:bg-white/[0.07] disabled:opacity-50">
        {active ? "Deactivate" : "Activate"}
      </button>
      <button type="button" disabled={loading} onClick={() => update("DELETE", "delete")} className="rounded-lg border border-red-400/20 bg-red-400/5 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-400/10 disabled:opacity-50">Delete</button>
    </div>
  )
}
