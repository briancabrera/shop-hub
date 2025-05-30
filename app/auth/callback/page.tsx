"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabaseClient } from "@/lib/db-client"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔄 Processing auth callback...")

        const { data, error } = await supabaseClient.auth.getSession()

        if (error) {
          console.error("❌ Auth callback error:", error)
          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive",
          })
          router.push("/login")
          return
        }

        if (data.session) {
          console.log("✅ Auth callback successful, user authenticated")
          toast({
            title: "Welcome!",
            description: "Your account has been verified successfully.",
          })
          router.push("/")
        } else {
          console.log("⚠️ No session found in auth callback")
          router.push("/login")
        }
      } catch (error) {
        console.error("❌ Unexpected error in auth callback:", error)
        toast({
          title: "Error",
          description: "Something went wrong during authentication.",
          variant: "destructive",
        })
        router.push("/login")
      }
    }

    handleAuthCallback()
  }, [router, toast])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your account...</h2>
        <p className="text-gray-600">Please wait while we complete your registration.</p>
      </div>
    </div>
  )
}
