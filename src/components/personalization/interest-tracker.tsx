"use client"

import { useEffect } from "react"
import { PERSONALIZATION_COOKIE, segmentFromValue } from "@/lib/personalization"

type Scores = { women: number; men: number; kids: number }

function readScores(): Scores {
  try {
    const raw = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${PERSONALIZATION_COOKIE}=`))
    if (!raw) return { women: 0, men: 0, kids: 0 }
    const parsed = JSON.parse(decodeURIComponent(raw.split("=").slice(1).join("=")))
    return { women: Number(parsed?.women) || 0, men: Number(parsed?.men) || 0, kids: Number(parsed?.kids) || 0 }
  } catch {
    return { women: 0, men: 0, kids: 0 }
  }
}

function saveScores(scores: Scores) {
  const payload = encodeURIComponent(JSON.stringify(scores))
  document.cookie = `${PERSONALIZATION_COOKIE}=${payload}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`
}

function addInterest(segment: keyof Scores | null, amount: number) {
  if (!segment) return
  const scores = readScores()
  scores[segment] = Math.min(scores[segment] + amount, 100)
  saveScores(scores)
}

export function InterestTracker() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const link = target?.closest("a") as HTMLAnchorElement | null
      if (!link) return
      const href = link.getAttribute("href") || ""
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return

      try {
        const url = new URL(href, window.location.origin)
        const categorySegment = segmentFromValue(url.searchParams.get("category"))
        const search = url.searchParams.get("q") || url.searchParams.get("search")
        if (categorySegment) addInterest(categorySegment, 3)
        if (search) addInterest(segmentFromValue(search), 2)
        if (url.pathname.startsWith("/product/")) addInterest(segmentFromValue(link.dataset.nooreGender), 4)
      } catch {}
    }

    const pageSignal = document.querySelector<HTMLElement>("[data-noore-page-gender]")?.dataset.noorePageGender
    if (pageSignal) addInterest(segmentFromValue(pageSignal), 5)

    const searchParams = new URLSearchParams(window.location.search)
    const pageGender = segmentFromValue(searchParams.get("gender"))
    if (pageGender) addInterest(pageGender, 2)

    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  return null
}
