"use client"

import { useEffect, useState } from "react"

type Courier = {
  id: string
  name: string
  accountNumber: string | null
  contractNumber: string | null
  contactName: string | null
  contactPhone: string | null
  contactEmail: string | null
  pickupAddress: string | null
  pickupCity: string | null
  serviceNotes: string | null
  apiBaseUrl: string | null
  apiKey: string | null
  apiSecret: string | null
  active: boolean
}

type CourierForm = {
  name: string
  accountNumber: string
  contractNumber: string
  contactName: string
  contactPhone: string
  contactEmail: string
  pickupAddress: string
  pickupCity: string
  serviceNotes: string
  apiBaseUrl: string
  apiKey: string
  apiSecret: string
  active: boolean
}

const blank: CourierForm = {
  name: "",
  accountNumber: "",
  contractNumber: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  pickupAddress: "",
  pickupCity: "",
  serviceNotes: "",
  apiBaseUrl: "",
  apiKey: "",
  apiSecret: "",
  active: true,
}

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([])
  const [form, setForm] = useState<CourierForm>(blank)
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)

    try {
      const response = await fetch(
        "/api/admin/couriers",
        {
          cache: "no-store",
        }
      )

      if (!response.ok) {
        setCouriers([])
        return
      }

      const data = await response.json()

      setCouriers(
        Array.isArray(data) ? data : []
      )
    } catch {
      setCouriers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function update(
    key: keyof CourierForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function edit(courier: Courier) {
    setEditing(courier.id)

    setForm({
      name: courier.name || "",
      accountNumber:
        courier.accountNumber || "",
      contractNumber:
        courier.contractNumber || "",
      contactName:
        courier.contactName || "",
      contactPhone:
        courier.contactPhone || "",
      contactEmail:
        courier.contactEmail || "",
      pickupAddress:
        courier.pickupAddress || "",
      pickupCity:
        courier.pickupCity || "",
      serviceNotes:
        courier.serviceNotes || "",
      apiBaseUrl:
        courier.apiBaseUrl || "",
      apiKey:
        courier.apiKey || "",
      apiSecret:
        courier.apiSecret || "",
      active:
        courier.active ?? true,
    })

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  function cancelEdit() {
    setEditing(null)
    setForm(blank)
  }

  async function save() {
    if (!form.name.trim()) {
      alert(
        "Please enter the courier company name."
      )
      return
    }

    setSaving(true)

    try {
      const response = await fetch(
        editing
          ? `/api/admin/couriers/${editing}`
          : "/api/admin/couriers",
        {
          method: editing
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not save courier"
        )
      }

      setForm(blank)
      setEditing(null)

      await load()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not save courier"
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove(id: string) {
    const confirmed = confirm(
      "Delete this courier company?"
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `/api/admin/couriers/${id}`,
        {
          method: "DELETE",
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Could not delete courier"
        )
      }

      if (editing === id) {
        cancelEdit()
      }

      await load()
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Could not delete courier"
      )
    }
  }

  return (
    <div className="max-w-6xl">

      {/* HEADER */}
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.22em] text-secondary">
          Operations
        </p>

        <h1 className="mt-2 text-3xl font-semibold">
          Courier Companies
        </h1>

        <p className="mt-2 text-sm text-secondary max-w-3xl">
          Save your contracted courier
          profiles once. Orders can then
          use a saved courier instead of
          re-entering company information
          every time.
        </p>
      </div>

      {/* FORM */}
      <section className="bg-white rounded-xl border border-cream p-6 mb-6">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">
              {editing
                ? "Edit courier contract"
                : "Add courier company"}
            </h2>

            <p className="text-sm text-secondary mt-1">
              Store the courier contract and
              pickup information here.
            </p>
          </div>

          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="text-sm text-secondary hover:text-charcoal"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">

          {/* COMPANY NAME */}
          <label className="text-sm font-medium">
            Company name *
            <input
              type="text"
              value={form.name}
              onChange={(event) =>
                update(
                  "name",
                  event.target.value
                )
              }
              placeholder="Courier company"
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>

          {/* ACCOUNT NUMBER */}
          <label className="text-sm font-medium">
            Account number
            <input
              type="text"
              value={form.accountNumber}
              onChange={(event) =>
                update(
                  "accountNumber",
                  event.target.value
                )
              }
              placeholder="Account number"
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>

          {/* CONTRACT NUMBER */}
          <label className="text-sm font-medium">
            Contract number
            <input
              type="text"
              value={form.contractNumber}
              onChange={(event) =>
                update(
                  "contractNumber",
                  event.target.value
                )
              }
              placeholder="Contract number"
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>

          {/* CONTACT NAME */}
          <label className="text-sm font-medium">
            Account/contact person
            <input
              type="text"
              value={form.contactName}
              onChange={(event) =>
                update(
                  "contactName",
                  event.target.value
                )
              }
              placeholder="Contact person"
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>

          {/* CONTACT PHONE */}
          <label className="text-sm font-medium">
            Contact phone
            <input
              type="text"
              value={form.contactPhone}
              onChange={(event) =>
                update(
                  "contactPhone",
                  event.target.value
                )
              }
              placeholder="+92..."
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>

          {/* CONTACT EMAIL */}
          <label className="text-sm font-medium">
            Contact email
            <input
              type="email"
              value={form.contactEmail}
              onChange={(event) =>
                update(
                  "contactEmail",
                  event.target.value
                )
              }
              placeholder="contact@courier.com"
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>

          {/* PICKUP CITY */}
          <label className="text-sm font-medium">
            Pickup city
            <input
              type="text"
              value={form.pickupCity}
              onChange={(event) =>
                update(
                  "pickupCity",
                  event.target.value
                )
              }
              placeholder="Lahore"
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>

          {/* API BASE URL */}
          <label className="text-sm font-medium">
            API base URL
            <input
              type="text"
              value={form.apiBaseUrl}
              onChange={(event) =>
                update(
                  "apiBaseUrl",
                  event.target.value
                )
              }
              placeholder="Optional"
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>

          {/* API KEY */}
          <label className="text-sm font-medium">
            API key
            <input
              type="password"
              value={form.apiKey}
              onChange={(event) =>
                update(
                  "apiKey",
                  event.target.value
                )
              }
              placeholder="Optional"
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>

          {/* API SECRET */}
          <label className="text-sm font-medium">
            API secret
            <input
              type="password"
              value={form.apiSecret}
              onChange={(event) =>
                update(
                  "apiSecret",
                  event.target.value
                )
              }
              placeholder="Optional"
              className="mt-1 w-full rounded border border-cream px-3 py-2"
            />
          </label>
        </div>

        {/* PICKUP ADDRESS */}
        <label className="block text-sm font-medium mt-4">
          Pickup address

          <textarea
            rows={2}
            value={form.pickupAddress}
            onChange={(event) =>
              update(
                "pickupAddress",
                event.target.value
              )
            }
            placeholder="Courier pickup address"
            className="mt-1 w-full rounded border border-cream px-3 py-2"
          />
        </label>

        {/* SERVICE NOTES */}
        <label className="block text-sm font-medium mt-4">
          Service notes

          <textarea
            rows={3}
            value={form.serviceNotes}
            onChange={(event) =>
              update(
                "serviceNotes",
                event.target.value
              )
            }
            placeholder="Contract terms, COD notes, pickup schedule..."
            className="mt-1 w-full rounded border border-cream px-3 py-2"
          />
        </label>

        {/* ACTIVE */}
        <label className="flex items-center gap-2 text-sm mt-4">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) =>
              update(
                "active",
                event.target.checked
              )
            }
          />

          <span>
            Active courier
          </span>
        </label>

        {/* BUTTONS */}
        <div className="flex gap-3 mt-5">

          <button
            type="button"
            onClick={save}
            disabled={
              saving ||
              !form.name.trim()
            }
            className="rounded bg-charcoal px-6 py-2.5 text-sm text-white disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : editing
              ? "Save Courier"
              : "Add Courier"}
          </button>

          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded border border-cream px-6 py-2.5 text-sm"
            >
              Cancel
            </button>
          )}
        </div>

        <p className="text-xs text-secondary mt-4">
          API credentials are optional
          profile fields for future courier
          API booking. The system does not
          pretend to book shipments through a
          courier API unless that carrier
          integration is actually configured.
        </p>
      </section>

      {/* SAVED COURIERS */}
      <section className="bg-white rounded-xl border border-cream overflow-hidden">

        <div className="p-5 border-b border-cream">
          <h2 className="font-semibold">
            Saved courier contracts
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-secondary">
            Loading couriers...
          </div>
        ) : couriers.length === 0 ? (
          <div className="p-8 text-secondary">
            No courier companies configured
            yet.
          </div>
        ) : (
          <div className="divide-y divide-cream">

            {couriers.map((courier) => (
              <div
                key={courier.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >

                <div>
                  <div className="flex items-center gap-2">

                    <p className="font-semibold">
                      {courier.name}
                    </p>

                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        courier.active
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {courier.active
                        ? "Active"
                        : "Disabled"}
                    </span>
                  </div>

                  <p className="text-sm text-secondary mt-1">
                    Account:{" "}
                    {courier.accountNumber ||
                      "—"}{" "}
                    · Contract:{" "}
                    {courier.contractNumber ||
                      "—"}
                  </p>

                  <p className="text-sm text-secondary">
                    Pickup:{" "}
                    {courier.pickupCity ||
                      "—"}{" "}
                    · Contact:{" "}
                    {courier.contactPhone ||
                      "—"}
                  </p>
                </div>

                <div className="flex gap-2">

                  <button
                    type="button"
                    onClick={() =>
                      edit(courier)
                    }
                    className="px-3 py-1.5 text-sm border border-cream rounded"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      remove(courier.id)
                    }
                    className="px-3 py-1.5 text-sm border border-red-200 text-red-700 rounded"
                  >
                    Delete
                  </button>

                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}