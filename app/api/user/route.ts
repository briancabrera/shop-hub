import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-utils"

// GET /api/user - Get current authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse("Authentication required", 401)
    }

    const token = authHeader.substring(7) // Remove "Bearer " prefix

    // Verify the token with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return errorResponse("Invalid authentication token", 401)
    }

    // Return user data directly from Supabase Auth
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.user_metadata?.name || "",
      created_at: user.created_at,
    }

    return successResponse(userData)
  } catch (error) {
    console.error("User API error:", error)
    return errorResponse("Failed to fetch user", 500)
  }
}
