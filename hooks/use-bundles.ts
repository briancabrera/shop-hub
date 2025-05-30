"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Bundle, BundleFilters } from "@/types/deals"
import { useToast } from "@/hooks/use-toast"

export function useBundles(filters?: BundleFilters) {
  return useQuery({
    queryKey: ["bundles", filters],
    queryFn: async () => {
      const params = new URLSearchParams()

      if (filters?.discount_type) params.set("discount_type", filters.discount_type)
      if (filters?.min_discount !== undefined) params.set("min_discount", filters.min_discount.toString())
      if (filters?.max_discount !== undefined) params.set("max_discount", filters.max_discount.toString())
      if (filters?.active_only) params.set("active_only", "true")

      const query = params.toString()
      const response = await fetch(`/api/bundles${query ? `?${query}` : ""}`)

      if (!response.ok) {
        throw new Error("Failed to fetch bundles")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch bundles")
      }

      return data.data as Bundle[]
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useActiveBundles() {
  return useBundles({ active_only: true })
}

export function useBundle(id: string) {
  return useQuery({
    queryKey: ["bundle", id],
    queryFn: async () => {
      const response = await fetch(`/api/bundles/${id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch bundle")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to fetch bundle")
      }

      return data.data as Bundle
    },
    enabled: !!id,
  })
}

export function useCreateBundle() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (bundleData: Partial<Bundle> & { items: Array<{ product_id: string; quantity: number }> }) => {
      const response = await fetch("/api/bundles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bundleData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to create bundle")
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || "Failed to create bundle")
      }

      return data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] })
      toast({
        title: "Success",
        description: "Bundle created successfully",
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
