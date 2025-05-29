import type { CartItemInput } from "@/types"

export const apiClient = {
  cart: {
    get: async () => {
      const response = await fetch("/api/cart")
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to fetch cart")
      }
      return response.json()
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
        const error = await response.json()
        throw new Error(error.message || "Failed to add item to cart")
      }
      return response.json()
    },
    remove: async (itemId: string) => {
      const response = await fetch(`/api/cart?id=${itemId}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to remove item from cart")
      }
      return response.json()
    },
  },
  // Otros métodos del API client...
}
