"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function DeleteProductButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!window.confirm("Delete this product? Products already used in orders will be archived instead.")) return
    setLoading(true)
    try {
      const response = await fetch(`/api/products/${id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || "Failed to delete product")
      router.refresh()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete product")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleDelete} disabled={loading} className="text-red-600 hover:text-red-800 disabled:opacity-50">
      {loading ? "Deleting..." : "Delete"}
    </button>
  )
}
