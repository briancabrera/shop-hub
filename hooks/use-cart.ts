"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-auth"
import type { CartItemInput } from "@/types"

// API client para el carrito
const cartApi = {
  getCart: async () => {
    const response = await fetch("/api/cart")
    if (!response.ok) {
      throw new Error(`Error fetching cart: ${response.statusText}`)
    }
    return response.json()
  },

  addItem: async (item: CartItemInput) => {
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    })

    if (!response.ok) {
      throw new Error(`Error adding item to cart: ${response.statusText}`)
    }

    return response.json()
  },

  updateItem: async (id: string, quantity: number) => {
    const response = await fetch(`/api/cart/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    })

    if (!response.ok) {
      throw new Error(`Error updating cart item: ${response.statusText}`)
    }

    return response.json()
  },

  removeItem: async (id: string) => {
    const response = await fetch(`/api/cart/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`Error removing item from cart: ${response.statusText}`)
    }

    return response.json()
  },

  clearCart: async () => {
    const response = await fetch("/api/cart", {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error(`Error clearing cart: ${response.statusText}`)
    }

    return response.json()
  },
}

// Hook para obtener el carrito actual
export function useCart() {
  const { data: user } = useUser()

  return useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.getCart,
    enabled: !!user,
    staleTime: 1 * 60 * 1000, // 1 minuto
  })
}

// Hook para añadir un item al carrito (producto o bundle)
export function useAddToCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (item: CartItemInput) => cartApi.addItem(item),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      toast({
        title: "Añadido al carrito",
        description: "El producto ha sido añadido a tu carrito",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    },
  })
}

// Hook para actualizar la cantidad de un item
export function useUpdateCartItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) => cartApi.updateItem(id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
  })
}

// Hook para eliminar un item del carrito
export function useRemoveFromCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => cartApi.removeItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
  })
}

// Hook para vaciar el carrito
export function useClearCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cartApi.clearCart,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
  })
}
