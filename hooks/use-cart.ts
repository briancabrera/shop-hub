"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface CartItem {
  id: string
  product_id?: string
  deal_id?: string
  bundle_id?: string
  quantity: number
  price: number
  original_price?: number
  savings?: number
  display_name: string
  display_image: string
  deal_title?: string
  deal_description?: string
  deal_discount_type?: string
  deal_discount_value?: number
  deal_expires_at?: string
  bundle_title?: string
  bundle_description?: string
  bundle_products?: Array<{
    id: string
    name: string
    price: number
    image: string
    quantity: number
  }>
}

export interface CartData {
  items: CartItem[]
  total: number
  item_count: number
  total_savings: number
}

export function useCart() {
  const queryClient = useQueryClient()

  // Get cart data
  const {
    data: cart,
    isLoading,
    error,
  } = useQuery<CartData>({
    queryKey: ["cart"],
    queryFn: async () => {
      const response = await fetch("/api/cart")
      if (!response.ok) {
        throw new Error("Failed to fetch cart")
      }
      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Add item to cart
  const addItemMutation = useMutation({
    mutationFn: async (item: {
      product_id?: string
      deal_id?: string
      bundle_id?: string
      quantity?: number
    }) => {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      })
      if (!response.ok) {
        const error = await response.text()
        throw new Error(error || "Failed to add item to cart")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      toast.success("Item added to cart")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add item to cart")
    },
  })

  // Update item quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, quantity }),
      })
      if (!response.ok) {
        throw new Error("Failed to update quantity")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update quantity")
    },
  })

  // Remove item from cart
  const removeItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!response.ok) {
        throw new Error("Failed to remove item")
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      toast.success("Item removed from cart")
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove item")
    },
  })

  return {
    cart: cart || { items: [], total: 0, item_count: 0, total_savings: 0 },
    isLoading,
    error,
    addItem: addItemMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeItem: removeItemMutation.mutate,
    isAddingItem: addItemMutation.isPending,
    isUpdatingQuantity: updateQuantityMutation.isPending,
    isRemovingItem: removeItemMutation.isPending,
  }
}
