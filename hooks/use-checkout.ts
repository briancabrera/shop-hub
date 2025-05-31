"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ShippingAddress {
  full_name: string
  address_line1: string
  city: string
  state: string
  postal_code: string
  country: string
}

interface CheckoutInput {
  items: Array<{
    product_id: string
    quantity: number
  }>
  shipping_address: ShippingAddress
}

interface CheckoutResponse {
  order_id: string
  total_amount: number
  status: string
  message: string
}

export function useCheckout() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: CheckoutInput): Promise<CheckoutResponse> => {
      try {
        console.log("Sending checkout request with data:", data)

        // Validate shipping address
        const { shipping_address } = data
        if (!shipping_address.full_name || !shipping_address.address_line1 || !shipping_address.postal_code) {
          throw new Error("Missing required shipping information")
        }

        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })

        const responseText = await response.text()
        console.log("Checkout response:", responseText)

        if (!response.ok) {
          let errorMessage = "Checkout failed"
          try {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.error || errorMessage
          } catch {
            errorMessage = responseText || errorMessage
          }
          throw new Error(errorMessage)
        }

        if (!responseText) {
          throw new Error("Empty response from server")
        }

        try {
          return JSON.parse(responseText)
        } catch {
          throw new Error("Invalid response format")
        }
      } catch (error) {
        console.error("Checkout error:", error)
        throw error
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Order placed successfully!")
      router.push(`/order-confirmation?order_id=${data.order_id}`)
    },
    onError: (error) => {
      console.error("Checkout mutation error:", error)
      toast.error(error.message || "Failed to process checkout")
    },
  })
}
