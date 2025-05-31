"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { supabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { User, UserSignupInput, UserLoginInput } from "@/types"
import { useEffect } from "react"

export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<User | null> => {
      try {
        const {
          data: { session },
          error,
        } = await supabaseClient.auth.getSession()

        if (error || !session?.user) {
          return null
        }

        return {
          id: session.user.id,
          email: session.user.email || "",
          full_name: session.user.user_metadata?.full_name || "",
          created_at: session.user.created_at || "",
        }
      } catch {
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
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
          data: { full_name: data.full_name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw new Error(error.message)
      if (!authData.user) throw new Error("Failed to create account")

      return authData
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user"] })

      if (data.user?.email_confirmed_at) {
        toast({
          title: "Account created",
          description: "You can now sign in.",
        })
        router.push("/login")
      } else {
        toast({
          title: "Check your email",
          description: "Please click the confirmation link to activate your account.",
          duration: 8000,
        })
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Signup failed",
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
      const { data: authData, error } = await supabaseClient.auth.signInWithPassword(data)

      if (error) throw new Error(error.message)
      if (!authData.user) throw new Error("Login failed")

      return authData
    },
    onSuccess: () => {
      // Invalidar todas las queries relacionadas con el usuario
      queryClient.invalidateQueries({ queryKey: ["user"] })
      queryClient.invalidateQueries({ queryKey: ["cart"] })

      toast({
        title: "Welcome back",
        description: "You have been logged in successfully",
      })
      router.push("/")
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
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
    },
    onSuccess: () => {
      queryClient.clear()
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

// Combined auth hook for convenience
export function useAuth() {
  const user = useUser()
  const signup = useSignup()
  const login = useLogin()
  const logout = useLogout()
  const queryClient = useQueryClient()

  // Escuchar cambios de autenticación
  useEffect(() => {
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      console.log("🔐 Auth state changed:", event, session?.user?.id)

      if (event === "SIGNED_IN") {
        // Invalidar queries cuando el usuario se loguea
        queryClient.invalidateQueries({ queryKey: ["user"] })
        queryClient.invalidateQueries({ queryKey: ["cart"] })
      } else if (event === "SIGNED_OUT") {
        // Limpiar queries cuando el usuario se desloguea
        queryClient.clear()
      }
    })

    return () => subscription.unsubscribe()
  }, [queryClient])

  return {
    user: user.data,
    isLoading: user.isLoading,
    isAuthenticated: !!user.data,
    signup,
    login,
    logout,
  }
}
