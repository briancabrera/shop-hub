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
      // First check if we have a session
      const {
        data: { session },
        error: sessionError,
      } = await supabaseClient.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        return null
      }

      if (!session?.user) {
        return null
      }

      // If we have a session, get user details
      try {
        return await apiClient.user.getCurrent()
      } catch (error) {
        console.error("Failed to get user details:", error)
        // If API fails, return basic user info from session
        return {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || "",
          created_at: session.user.created_at,
        }
      }
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
      console.log("🔄 Starting signup process for:", data.email)

      const { data: authData, error } = await supabaseClient.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      console.log("📧 Supabase signup response:", {
        user: authData.user ? { id: authData.user.id, email: authData.user.email } : null,
        session: authData.session ? "Session created" : "No session",
        error: error ? error.message : "No error",
      })

      if (error) {
        console.error("❌ Signup error:", error)
        throw new Error(error.message)
      }

      if (!authData.user) {
        console.error("❌ No user returned from signup")
        throw new Error("Failed to create user account")
      }

      console.log("✅ Signup successful for user:", authData.user.id)
      return authData
    },
    onSuccess: (data) => {
      console.log("🎉 Signup mutation successful")
      queryClient.invalidateQueries({ queryKey: ["user"] })

      if (data.user?.email_confirmed_at) {
        console.log("✅ Email already confirmed, redirecting to login")
        toast({
          title: "Account created",
          description: "Your account has been created successfully. You can now sign in.",
        })
        router.push("/login")
      } else {
        console.log("📧 Email confirmation required")
        toast({
          title: "Check your email",
          description: `We've sent a confirmation link to ${data.user?.email}. Please check your email and click the link to activate your account.`,
          duration: 8000,
        })
        // Stay on signup page or redirect to a confirmation page
      }
    },
    onError: (error: Error) => {
      console.error("❌ Signup mutation failed:", error.message)
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
      console.log("🔄 Starting login process for:", data.email)

      const { data: authData, error } = await supabaseClient.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      console.log("🔐 Supabase login response:", {
        user: authData.user ? { id: authData.user.id, email: authData.user.email } : null,
        session: authData.session ? "Session created" : "No session",
        error: error ? error.message : "No error",
      })

      if (error) {
        console.error("❌ Login error:", error)
        throw new Error(error.message)
      }

      if (!authData.user) {
        console.error("❌ No user returned from login")
        throw new Error("Login failed")
      }

      console.log("✅ Login successful for user:", authData.user.id)
      return authData
    },
    onSuccess: () => {
      console.log("🎉 Login mutation successful")
      queryClient.invalidateQueries({ queryKey: ["user"] })
      toast({
        title: "Welcome back",
        description: "You have been logged in successfully",
      })
      router.push("/")
    },
    onError: (error: Error) => {
      console.error("❌ Login mutation failed:", error.message)
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
