import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-utils"

// GET /api/user - Get current authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const {
      data: { session },
    } = await supabaseAdmin.auth.getSession()
    const userId = session?.user?.id

    if (!userId) {
      return errorResponse("Authentication required", 401)
    }

    // Get user details from our database
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, created_at")
      .eq("id", userId)
      .single()

    if (error) {
      return errorResponse("User not found", 404)
    }

    return successResponse(user)
  } catch (error) {
    return errorResponse("Failed to fetch user", 500)
  }
}
