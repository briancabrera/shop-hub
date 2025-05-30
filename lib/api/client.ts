import type { CartItemInput } from "@/types"

export const apiClient = {
  cart: {
    get: async () => {
      const response = await fetch("/api/cart")
      if (!response.ok) {
        let errorMessage = "Failed to fetch cart"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      const result = await response.json()
      return result
    },
    add: async (item: CartItemInput) => {
      console.log("API Client - Adding to cart:", JSON.stringify(item, null, 2))
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(item),
      })

      if (!response.ok) {
        let errorMessage = "Failed to add item to cart"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result.data || result
    },
    remove: async (itemId: string) => {
      const response = await fetch(`/api/cart?id=${itemId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        let errorMessage = "Failed to remove item from cart"
        try {
          const error = await response.json()
          errorMessage = error.error || errorMessage
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    },
  },
  // Otros métodos del API client...
}
