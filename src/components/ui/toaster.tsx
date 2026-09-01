"use client"

import { useEffect, useState } from "react"

type Toast = {
  id: string
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

let toastId = 0

export function toast({ title, description, variant = "default" }: Omit<Toast, "id">) {
  const id = String(toastId++)
  const event = new CustomEvent("toast", { detail: { id, title, description, variant } })
  window.dispatchEvent(event)
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      setToasts(prev => [...prev, detail])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== detail.id))
      }, 4000)
    }
    window.addEventListener("toast", handler)
    return () => window.removeEventListener("toast", handler)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`p-4 rounded-lg shadow-lg border ${
            t.variant === "destructive" 
              ? "bg-red-50 border-red-200 text-red-800" 
              : "bg-white border-gray-200 text-gray-900"
          }`}
        >
          {t.title && <div className="font-semibold">{t.title}</div>}
          {t.description && <div className="text-sm mt-1">{t.description}</div>}
        </div>
      ))}
    </div>
  )

  
}
