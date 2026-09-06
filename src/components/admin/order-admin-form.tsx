"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const statuses = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "PACKED",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
]

const payments = [
  "UNPAID",
  "PAID",
  "FAILED",
  "REFUNDED",
]

type CourierCompany = {
  id: string
  name: string
  accountNumber: string | null
  contractNumber: string | null
  pickupCity: string | null
  pickupAddress: string | null
}

type OrderAdminFormProps = {
  orderId: string
  initialStatus: string
  initialPaymentStatus: string
  initialTrackingNumber: string
  initialCourier: string
  initialCourierCompanyId?: string | null
}

export function OrderAdminForm({
  orderId,
  initialStatus,
  initialPaymentStatus,
  initialTrackingNumber,
  initialCourier,
  initialCourierCompanyId,
}: OrderAdminFormProps) {
  const router = useRouter()

  const [status, setStatus] = useState(initialStatus)
  const [paymentStatus, setPaymentStatus] = useState(initialPaymentStatus)
  const [trackingNumber, setTrackingNumber] = useState(
    initialTrackingNumber
  )
  const [courier, setCourier] = useState(initialCourier)

  const [courierCompanyId, setCourierCompanyId] = useState(
    initialCourierCompanyId || ""
  )

  const [couriers, setCouriers] = useState<CourierCompany[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadCouriers() {
      try {
        const response = await fetch("/api/admin/couriers", {
          cache: "no-store",
        })

        if (!response.ok) {
          if (!cancelled) {
            setCouriers([])
          }
          return
        }

        const data = await response.json()

        if (!cancelled) {
          setCouriers(Array.isArray(data) ? data : [])
        }
      } catch {
        if (!cancelled) {
          setCouriers([])
        }
      }
    }

    loadCouriers()

    return () => {
      cancelled = true
    }
  }, [])

  const selectedCourier = couriers.find(
    (courierCompany) =>
      courierCompany.id === courierCompanyId
  )

  function chooseCourier(id: string) {
    setCourierCompanyId(id)

    const company = couriers.find(
      (courierCompany) =>
        courierCompany.id === id
    )

    if (company) {
      setCourier(company.name)
    }
  }

  async function save() {
    setSaving(true)

    try {
      const response = await fetch(
        `/api/admin/orders/${orderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            paymentStatus,
            trackingNumber,
            courier,
            courierCompanyId:
              courierCompanyId || null,
          }),
        }
      )

      const data = await response
        .json()
        .catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to update order"
        )
      }

      router.refresh()

      alert(
        "Order updated successfully"
      )
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update order"
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-cream p-6 h-fit lg:sticky lg:top-6">
      <h2 className="text-lg font-semibold mb-5">
        Order Management
      </h2>

      <div className="space-y-4">

        {/* ORDER STATUS */}
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            Order Status
          </span>

          <select
            value={status}
            onChange={(event) =>
              setStatus(event.target.value)
            }
            className="w-full px-3 py-2 border border-cream rounded"
          >
            {statuses.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </label>

        {/* PAYMENT STATUS */}
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            Payment Status
          </span>

          <select
            value={paymentStatus}
            onChange={(event) =>
              setPaymentStatus(
                event.target.value
              )
            }
            className="w-full px-3 py-2 border border-cream rounded"
          >
            {payments.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>
        </label>

        {/* COURIER COMPANY */}
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            Courier Company
          </span>

          <select
            value={courierCompanyId}
            onChange={(event) =>
              chooseCourier(
                event.target.value
              )
            }
            className="w-full px-3 py-2 border border-cream rounded"
          >
            <option value="">
              Select contracted courier...
            </option>

            {couriers.map((company) => (
              <option
                key={company.id}
                value={company.id}
              >
                {company.name}
              </option>
            ))}
          </select>
        </label>

        {/* CONTRACT PROFILE */}
        {selectedCourier && (
          <div className="rounded border border-cream bg-cream/30 p-3 text-xs text-secondary">
            <p className="font-medium text-charcoal mb-1">
              Contract profile loaded
              automatically
            </p>

            <p>
              Account:{" "}
              {selectedCourier.accountNumber ||
                "—"}
              {" · "}
              Contract:{" "}
              {selectedCourier.contractNumber ||
                "—"}
            </p>

            <p className="mt-1">
              Pickup City:{" "}
              {selectedCourier.pickupCity ||
                "—"}
            </p>

            <p className="mt-1">
              Pickup Address:{" "}
              {selectedCourier.pickupAddress ||
                "—"}
            </p>
          </div>
        )}

        {/* COURIER NAME */}
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            Courier Name
          </span>

          <input
            value={courier}
            onChange={(event) =>
              setCourier(
                event.target.value
              )
            }
            placeholder="TCS, Leopards, M&P..."
            className="w-full px-3 py-2 border border-cream rounded"
          />

          <p className="text-xs text-secondary mt-1">
            Selecting a contracted courier
            automatically fills this field.
            You can manually override it if
            needed.
          </p>
        </label>

        {/* TRACKING NUMBER */}
        <label className="block">
          <span className="block text-sm font-medium mb-1">
            Tracking Number
          </span>

          <input
            value={trackingNumber}
            onChange={(event) =>
              setTrackingNumber(
                event.target.value
              )
            }
            placeholder="Enter tracking number"
            className="w-full px-3 py-2 border border-cream rounded"
          />
        </label>

        {/* SAVE */}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full bg-charcoal text-white py-3 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving
            ? "Saving..."
            : "Save Order Changes"}
        </button>

      </div>
    </section>
  )
}