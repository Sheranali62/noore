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
    <div className="flex gap-2 items-center">
      <a href={`/admin/coupons/edit/${id}`} className="text-sm underline">Edit</a>
      <button type="button" disabled={loading} onClick={() => update("PATCH", active ? "deactivate" : "activate")} className="text-sm underline disabled:opacity-50">
        {active ? "Deactivate" : "Activate"}
      </button>
      <button type="button" disabled={loading} onClick={() => update("DELETE", "delete")} className="text-sm text-red-600 underline disabled:opacity-50">Delete</button>
    </div>
  )
}
