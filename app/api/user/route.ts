import type { NextRequest } from "next/server"
import { successResponse } from "@/lib/api-utils"

// GET /api/user - Get current authenticated user
export async function GET(request: NextRequest) {
  try {
    console.log("User API: GET request received")

    // For now, just return success - the client will handle user data via session
    return successResponse({ message: "User endpoint available" })
  } catch (error) {
    console.error("User API error:", error)
    return successResponse({ message: "User endpoint available" })
  }
}
