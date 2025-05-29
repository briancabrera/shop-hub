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

    // Get user details from our database
    const { data: userData, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, created_at")
      .eq("id", user.id)
      .single()

    if (error) {
      return errorResponse("User not found", 404)
    }

    return successResponse(userData)
  } catch (error) {
    console.error("User API error:", error)
    return errorResponse("Failed to fetch user", 500)
  }
}
