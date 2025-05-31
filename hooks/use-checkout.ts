"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

export function useCheckout() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (checkoutData: any) => {
      console.log("Sending checkout request:", checkoutData)

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkoutData),
      })

      console.log("Checkout response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Checkout error response:", errorText)

        let errorMessage = "Checkout failed"
        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Checkout success:", result)
      return result
    },
    onSuccess: (data) => {
      console.log("Checkout mutation success:", data)
      // Redirect to order confirmation page
      router.push(`/order-confirmation?order_id=${data.data.order_id}`)
    },
    onError: (error) => {
      console.error("Checkout mutation error:", error)
      alert(error.message || "Checkout failed. Please try again.")
    },
  })
}
