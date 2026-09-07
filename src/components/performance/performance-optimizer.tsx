"use client"

import { useEffect } from "react"

/** Small client-side performance guardrail for the storefront. */
export function PerformanceOptimizer() {
  useEffect(() => {
    const root = document.documentElement
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string }
    }).connection

    const constrained =
      Boolean(connection?.saveData) ||
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g" ||
      (navigator.hardwareConcurrency || 8) <= 4

    if (constrained) root.classList.add("noore-lite")

    const onVisibility = () => {
      root.classList.toggle("noore-hidden", document.visibilityState === "hidden")
    }

    document.addEventListener("visibilitychange", onVisibility)
    onVisibility()

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      root.classList.remove("noore-lite", "noore-hidden")
    }
  }, [])

  return null
}
