"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import type { Bundle, BundleFilters, BundleCreateInput } from "@/types"

// API client para bundles
const bundlesApi = {
  getAll: async (filters?: BundleFilters) => {
    const params = new URLSearchParams()

    if (filters?.status) params.append("status", filters.status)
    if (filters?.featured !== undefined) params.append("featured", String(filters.featured))
    if (filters?.active !== undefined) params.append("active", String(filters.active))
    if (filters?.page) params.append("page", String(filters.page))
    if (filters?.limit) params.append("limit", String(filters.limit))

    const queryString = params.toString() ? `?${params.toString()}` : ""

    const response = await fetch(`/api/bundles${queryString}`)
    if (!response.ok) {
      throw new Error(`Error fetching bundles: ${response.statusText}`)
    }

    return response.json()
  },

  getById: async (id: string) => {
    const response = await fetch(`/api/bundles/${id}`)
    if (!response.ok) {
      throw new Error(`Error fetching bundle: ${response.statusText}`)
    }

    return response.json()
  },

  create: async (data: BundleCreateInput) => {
    const response = await fetch("/api/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error creating bundle: ${response.statusText}`)
    }

    return response.json()
  },

  update: async (id: string, data: Partial<Bundle>) => {
    const response = await fetch(`/api/bundles/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error updating bundle: ${response.statusText}`)
    }

    return response.json()
  },

  delete: async (id: string) => {
    const response = await fetch(`/api/bundles/${id}`, {
      method: "DELETE",
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Error deleting bundle: ${response.statusText}`)
    }

    return response.json()
  },
}

// Hook para obtener todos los bundles
export function useBundles(filters?: BundleFilters) {
  return useQuery({
    queryKey: ["bundles", filters],
    queryFn: () => bundlesApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para obtener un bundle específico
export function useBundle(id: string) {
  return useQuery({
    queryKey: ["bundles", id],
    queryFn: () => bundlesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

// Hook para crear un nuevo bundle
export function useCreateBundle() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: BundleCreateInput) => bundlesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] })
      toast({
        title: "Bundle creado",
        description: "El bundle se ha creado correctamente",
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

// Hook para actualizar un bundle
export function useUpdateBundle(id: string) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: Partial<Bundle>) => bundlesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] })
      queryClient.invalidateQueries({ queryKey: ["bundles", id] })
      toast({
        title: "Bundle actualizado",
        description: "El bundle se ha actualizado correctamente",
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

// Hook para eliminar un bundle
export function useDeleteBundle() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => bundlesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bundles"] })
      toast({
        title: "Bundle eliminado",
        description: "El bundle se ha eliminado correctamente",
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
