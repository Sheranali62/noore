import { Suspense } from "react"
import OrderConfirmationContent from "./OrderConfirmationContent"

function LoadingOrderConfirmation() {
  return (
    <div className="min-h-screen bg-cream py-16 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-charcoal mx-auto" />
        <p className="mt-4 text-secondary">Processing your order...</p>
      </div>
    </div>
  )
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingOrderConfirmation />}>
      <OrderConfirmationContent />
    </Suspense>
  )
}
