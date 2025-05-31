"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"

export function useCheckout() {
  const router = useRouter()
  const { toast } = useToast()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (checkoutData: any) => {
      // Check if user is authenticated
      if (!isAuthenticated) {
        throw new Error("Please log in to complete your purchase")
      }

      console.log("Sending checkout request with authenticated user")

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important for sending cookies
        body: JSON.stringify(checkoutData),
      })

      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = "Checkout failed"

        try {
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }

        throw new Error(errorMessage)
      }

      return await response.json()
    },
    onSuccess: (data) => {
      // Invalidate cart query to refresh cart state
      queryClient.invalidateQueries({ queryKey: ["cart"] })

      toast({
        title: "Order placed successfully!",
        description: "Your order has been processed.",
      })

      // Redirect to order confirmation page
      router.push(`/order-confirmation?order_id=${data.data.order_id}`)
    },
    onError: (error: Error) => {
      console.error("Checkout error:", error)

      if (error.message.includes("log in") || error.message.includes("Authentication required")) {
        toast({
          title: "Authentication required",
          description: "Please log in to complete your purchase",
          variant: "destructive",
        })

        // Redirect to login page with return URL
        router.push(`/login?returnUrl=${encodeURIComponent("/checkout")}`)
      } else {
        toast({
          title: "Checkout failed",
          description: error.message,
          variant: "destructive",
        })
      }
    },
  })
}
