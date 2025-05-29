import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { successResponse } from "@/lib/api-utils"

// GET /api/user - Get current authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log("User API: GET request received")

    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("User API: No auth header, returning null user")
      return successResponse(null)
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify the token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.log("User API: Invalid token, returning null user")
      return successResponse(null)
    }

    // Return user data directly from Supabase Auth
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      created_at: user.created_at,
    }

    console.log(`User API: Returning user data for ${user.email}`)
    return successResponse(userData)
  } catch (error) {
    console.error("User API error:", error)
    // Return null user instead of error
    return successResponse(null)
  }
}
