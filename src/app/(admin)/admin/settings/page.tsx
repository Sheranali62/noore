"use client"

import { useEffect, useState } from "react"
import { ArrowDownToLine, Check, CircleDollarSign, Megaphone, PackageCheck, RotateCcw, Save, Settings2, Store } from "lucide-react"

const defaults = {
  siteName: "NOORÉ",
  announcementText: "FREE SHIPPING ON ORDERS ABOVE PKR 5,000",
  freeShippingThreshold: "5000",
  standardShipping: "250",
  expressShipping: "500",
  currency: "PKR",
}

type Settings = typeof defaults

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaults)
  const [savedSettings, setSavedSettings] = useState<Settings>(defaults)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    let active = true
    fetch("/api/admin/settings", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Unable to load store settings.")
        const next = { ...defaults, ...data.settings }
        if (active) {
          setSettings(next)
          setSavedSettings(next)
          setHasLoaded(true)
        }
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : "Unable to load store settings.")
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const update = (key: keyof Settings, value: string) => {
    setSettings((current) => ({ ...current, [key]: value }))
    setMessage("")
    setError("")
  }

  const changed = (Object.keys(settings) as (keyof Settings)[]).some((key) => settings[key] !== savedSettings[key])

  const save = async () => {
    if (!settings.siteName.trim()) {
      setError("Please enter a store name.")
      return
    }
    if (!settings.currency.trim()) {
      setError("Please choose a currency.")
      return
    }
    for (const key of ["freeShippingThreshold", "standardShipping", "expressShipping"] as const) {
      const amount = Number(settings[key])
      if (!Number.isFinite(amount) || amount < 0) {
        setError("Shipping amounts must be valid numbers and cannot be negative.")
        return
      }
    }

    setSaving(true)
    setMessage("")
    setError("")
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Unable to save settings.")
      const next = { ...defaults, ...data.settings }
      setSettings(next)
      setSavedSettings(next)
      setMessage("Your store settings have been saved.")
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save settings.")
    } finally {
      setSaving(false)
    }
  }

  const discard = () => {
    setSettings(savedSettings)
    setError("")
    setMessage("Unsaved changes were discarded.")
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <PageHeader />
        <div className="rounded-2xl border border-[#d6ae72]/15 bg-white/[0.035] p-10 text-center text-sm text-white/50">
          Loading your store settings…
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl pb-12">
      <PageHeader />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SummaryCard icon={Store} label="Store identity" value={settings.siteName || "Not set"} />
        <SummaryCard icon={CircleDollarSign} label="Store currency" value={settings.currency} />
        <SummaryCard icon={PackageCheck} label="Free shipping from" value={formatMoney(settings.freeShippingThreshold, settings.currency)} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <SettingsSection icon={Store} eyebrow="01 / Identity" title="Store identity" description="The name and currency used across your storefront.">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Store name" hint="Displayed as your storefront identity." value={settings.siteName} onChange={(value) => update("siteName", value)} />
              <label className="block text-sm">
                <FieldLabel>Store currency</FieldLabel>
                <select value={settings.currency} onChange={(event) => update("currency", event.target.value)} className={inputClass}>
                  <option value="PKR">PKR — Pakistani Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                </select>
                <FieldHint>Used to format shipping amounts in this settings panel.</FieldHint>
              </label>
            </div>
          </SettingsSection>

          <SettingsSection icon={Megaphone} eyebrow="02 / Storefront message" title="Announcement bar" description="Manage the promotional message displayed at the top of your website.">
            <Field label="Announcement message" value={settings.announcementText} onChange={(value) => update("announcementText", value)} placeholder="Enter your announcement…" />
            <div className="mt-5 overflow-hidden rounded-xl border border-[#d6ae72]/20 bg-[#090909]">
              <div className="border-b border-white/10 px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/35">Live preview</div>
              <div className="px-4 py-4 text-center text-[10px] font-semibold uppercase tracking-[0.19em] text-[#e4c28e]">
                {settings.announcementText.trim() || "Your announcement will appear here"}
              </div>
            </div>
          </SettingsSection>

          <SettingsSection icon={ArrowDownToLine} eyebrow="03 / Delivery" title="Shipping rates" description="Set the order value that qualifies for free shipping and your delivery charges.">
            <div className="grid gap-5 md:grid-cols-3">
              <Field label="Free shipping threshold" prefix={currencySymbol(settings.currency)} type="number" min="0" value={settings.freeShippingThreshold} onChange={(value) => update("freeShippingThreshold", value)} />
              <Field label="Standard delivery" prefix={currencySymbol(settings.currency)} type="number" min="0" value={settings.standardShipping} onChange={(value) => update("standardShipping", value)} />
              <Field label="Express delivery" prefix={currencySymbol(settings.currency)} type="number" min="0" value={settings.expressShipping} onChange={(value) => update("expressShipping", value)} />
            </div>
            <p className="mt-4 text-xs leading-5 text-white/35">These values are saved to your existing store settings. Check your checkout implementation before changing prices shown to customers.</p>
          </SettingsSection>

          {error && <div role="alert" className="rounded-xl border border-red-400/25 bg-red-400/[0.08] px-4 py-3 text-sm text-red-200">{error}</div>}
          {message && <div role="status" className="flex items-center gap-2 rounded-xl border border-[#d6ae72]/25 bg-[#d6ae72]/[0.08] px-4 py-3 text-sm text-[#e4c28e]"><Check className="h-4 w-4" />{message}</div>}

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            <div>
              <p className="text-sm font-medium text-white">{changed ? "You have unsaved changes" : "All changes are saved"}</p>
              <p className="mt-1 text-xs text-white/40">Your current settings are stored in the NOORÉ database.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={discard} disabled={!changed || saving} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-xs font-semibold text-white/75 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-35">
                <RotateCcw className="h-3.5 w-3.5" /> Discard
              </button>
              <button type="button" onClick={save} disabled={saving || !changed || !hasLoaded} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#e6c47f] to-[#c2944e] px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-[#17110a] shadow-[0_6px_24px_rgba(214,174,114,.12)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45">
                <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save settings"}
              </button>
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="rounded-2xl border border-[#d6ae72]/20 bg-gradient-to-br from-[#d6ae72]/[0.11] to-white/[0.025] p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d6ae72]/25 bg-[#d6ae72]/10 text-[#e4c28e]"><Settings2 className="h-5 w-5" /></div>
            <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#d6ae72]">Settings guide</p>
            <h2 className="mt-2 font-editorial text-2xl text-white">Keep your store in sync.</h2>
            <p className="mt-3 text-sm leading-6 text-white/55">Changes here update the saved store configuration. Some storefront elements may use cached values briefly before refreshing.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
            <h3 className="text-sm font-semibold text-white">Current delivery setup</h3>
            <div className="mt-4 space-y-3">
              <RateRow label="Free shipping" value={formatMoney(settings.freeShippingThreshold, settings.currency) + " order"} />
              <RateRow label="Standard" value={formatMoney(settings.standardShipping, settings.currency)} />
              <RateRow label="Express" value={formatMoney(settings.expressShipping, settings.currency)} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function PageHeader() {
  return (
    <header className="mb-7">
      <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#d6ae72]">NOORÉ / Administration</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-editorial text-4xl text-white sm:text-5xl">Store settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/45">Manage your storefront identity, announcement and delivery pricing.</p>
        </div>
        <span className="rounded-full border border-[#d6ae72]/25 bg-[#d6ae72]/[0.08] px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#e4c28e]">Configuration</span>
      </div>
    </header>
  )
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof Store; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center gap-2 text-[#d6ae72]"><Icon className="h-4 w-4" /><span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/40">{label}</span></div>
      <p className="mt-3 truncate text-lg font-semibold text-white">{value}</p>
    </div>
  )
}

function SettingsSection({ icon: Icon, eyebrow, title, description, children }: { icon: typeof Store; eyebrow: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 shadow-[0_12px_40px_rgba(0,0,0,.12)] sm:p-6">
      <div className="mb-6 flex items-start gap-3 border-b border-white/[0.08] pb-5">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d6ae72]/20 bg-[#d6ae72]/[0.08] text-[#e4c28e]"><Icon className="h-4 w-4" /></div>
        <div><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#d6ae72]">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold text-white">{title}</h2><p className="mt-1 text-xs leading-5 text-white/40">{description}</p></div>
      </div>
      {children}
    </section>
  )
}

function Field({ label, value, onChange, hint, placeholder, type = "text", min, prefix }: { label: string; value: string; onChange: (value: string) => void; hint?: string; placeholder?: string; type?: string; min?: string; prefix?: string }) {
  return (
    <label className="block text-sm">
      <FieldLabel>{label}</FieldLabel>
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/35">{prefix}</span>}
        <input type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={inputClass + (prefix ? " pl-10" : "")} />
      </div>
      {hint && <FieldHint>{hint}</FieldHint>}
    </label>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">{children}</span>
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <span className="mt-2 block text-[11px] leading-5 text-white/35">{children}</span>
}

function RateRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] pb-3 last:border-0 last:pb-0"><span className="text-xs text-white/45">{label}</span><span className="text-xs font-semibold tabular-nums text-[#e4c28e]">{value}</span></div>
}

function currencySymbol(currency: string) {
  return currency === "USD" ? "$" : "₨"
}

function formatMoney(value: string, currency: string) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "—"
  return new Intl.NumberFormat("en-PK", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
}

const inputClass = "w-full rounded-xl border border-white/10 bg-[#090909]/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-[#d6ae72]/60 focus:ring-2 focus:ring-[#d6ae72]/10"
