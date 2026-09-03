"use client"

import { useEffect } from "react"

const THEME_KEY = "noore-auto-theme"

function isDaytime(date = new Date()) {
  // The browser clock is already localized to the visitor's timezone.
  // Keep the storefront bright for the normal daytime window and dark overnight.
  const hour = date.getHours()
  return hour >= 7 && hour < 19
}

function applyTheme() {
  const dark = !isDaytime()
  const root = document.documentElement
  root.classList.toggle("dark", dark)
  root.style.colorScheme = dark ? "dark" : "light"
  root.setAttribute("data-noore-theme", dark ? "night" : "day")
  localStorage.setItem(THEME_KEY, dark ? "night" : "day")

  const themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) {
    themeColor.setAttribute("content", dark ? "#11100F" : "#FAF9F6")
  }
}

export function AutoDayNightTheme() {
  useEffect(() => {
    applyTheme()

    // Re-check at the next hour boundary and whenever the visitor returns to the tab.
    const interval = window.setInterval(applyTheme, 60_000)
    const onVisibility = () => {
      if (document.visibilityState === "visible") applyTheme()
    }

    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  return null
}
