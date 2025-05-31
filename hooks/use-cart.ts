"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"
import { supabaseClient } from "@/lib/supabase/client"
import type { CartItemInput } from "@/types"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"

export function useCart() {
  const { isAuthenticated, user } = useAuth()

  return useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      console.log("🛒 useCart: Fetching cart data for user:", user?.id)

      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession()

        if (!session?.user) {
          console.log("🛒 useCart: No authenticated user, returning empty cart")
          return {
            items: [],
            total: 0,
            original_total: 0,
            total_savings: 0,
            product_items: [],
            deal_items: [],
            bundle_items: [],
            item_count: 0,
          }
        }

        console.log("🛒 useCart: Calling API to get cart data")
        const cartData = await apiClient.cart.get()
        console.log("🛒 useCart: Cart data received:", cartData)

        // Calcular el total de items basado en cart_items, no en productos individuales
        const itemCount = (cartData.items || []).reduce((total, item) => total + item.quantity, 0)

        const result = {
          ...cartData,
          item_count: itemCount,
        }

        console.log("🛒 useCart: Final cart result:", result)
        return result
      } catch (error) {
        console.error("🛒 useCart: Error fetching cart:", error)
        return {
          items: [],
          total: 0,
          original_total: 0,
          total_savings: 0,
          product_items: [],
          deal_items: [],
          bundle_items: [],
          item_count: 0,
        }
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: true, // Siempre habilitado para que se ejecute
    refetchOnMount: true, // Refetch cuando el componente se monta
    refetchOnWindowFocus: false, // No refetch en window focus para evitar llamadas excesivas
  })
}

export function useAddToCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (item: CartItemInput) => {
      console.log("useAddToCart: Adding item to cart:", item)

      const {
        data: { session },
      } = await supabaseClient.auth.getSession()

      if (!session?.user) {
        throw new Error("AUTHENTICATION_REQUIRED")
      }

      try {
        const result = await apiClient.cart.add(item)
        console.log("useAddToCart: Success response:", result)
        return result
      } catch (error) {
        console.error("useAddToCart: Error adding to cart:", error)
        throw error
      }
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas con el carrito
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] })

      let message = "Item has been added to your cart"
      if (variables.item_type === "deal") {
        message = "Deal has been added to your cart"
      } else if (variables.item_type === "bundle") {
        message = "Bundle has been added to your cart"
      }

      toast({
        title: "Added to cart",
        description: message,
      })
    },
    onError: (error: Error) => {
      console.error("useAddToCart onError:", error)

      if (error.message === "AUTHENTICATION_REQUIRED" || error.message.includes("sign in")) {
        toast({
          title: "Sign in required",
          description: "Please sign in to add items to your cart",
          variant: "destructive",
        })
        router.push("/login")
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to add item to cart",
          variant: "destructive",
        })
      }
    },
  })
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (itemId: string) => {
      return await apiClient.cart.remove(itemId)
    },
    onSuccess: () => {
      // Invalidar queries relacionadas con el carrito
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["cart", user?.id] })

      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart",
      })
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove item from cart",
        variant: "destructive",
      })
    },
  })
}
