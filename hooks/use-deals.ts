"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Deal, DealFilters } from "@/types/deals"
import { useToast } from "@/hooks/use-toast"

export function useDeals(filters?: DealFilters) {
  return useQuery({
    queryKey: ["deals", filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.category) params.set("category", filters.category)
      if (filters?.discount_type) params.set("discount_type", filters.discount_type)
      if (filters?.min_discount !== undefined) params.set("min_discount", filters.min_discount.toString())
      if (filters?.max_discount !== undefined) params.set("max_discount", filters.max_discount.toString())
      if (filters?.active_only) params.set("active_only", "true")

      const query = params.toString()
      const response = await fetch(`/api/deals${query ? `?${query}` : ""}`)

      if (!response.ok) {
        throw new Error("Failed to fetch deals")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch deals")
      }

      return data.data as Deal[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useActiveDeals() {
  return useDeals({ active_only: true })
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ["deal", id],
    queryFn: async () => {
      const response = await fetch(`/api/deals/${id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch deal")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch deal")
      }

      return data.data as Deal
    },
    enabled: !!id,
  })
}

export function useCreateDeal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (dealData: Partial<Deal>) => {
      const response = await fetch("/api/deals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dealData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create deal")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to create deal")
      }

      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] })
      toast({
        title: "Success",
        description: "Deal created successfully",
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
