"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { UserSignupInput, UserLoginInput } from "@/types/api"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/db-client"

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession()
      if (!session) return null

      return apiClient.user.getCurrent()
    },
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useSignup() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: UserSignupInput) => {
      const { data: authData, error } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
        },
      })

      if (error) throw new Error(error.message)
      return authData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] })
      toast({
        title: "Account created",
        description: "Your account has been created successfully. Please check your email for verification.",
      })
      router.push("/login")
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

export function useLogin() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  return useMutation({
    mutationFn: async (data: UserLoginInput) => {
      const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw new Error(error.message)
      return authData
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] })
      toast({
        title: "Welcome back",
        description: "You have been logged in successfully",
      })
      router.push("/")
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

export function useLogout() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const router = useRouter()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabaseClient.auth.signOut()
      if (error) throw new Error(error.message)
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] })
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      })
      router.push("/")
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
