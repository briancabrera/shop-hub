import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { ApiResponse } from "@/types"

export function createResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  )
}

export function createErrorResponse(error: string, status = 500): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      data: null,
      error,
    },
    { status },
  )
}

export function handleApiError(error: unknown, defaultStatus = 500): NextResponse<ApiResponse<null>> {
  console.error("API Error:", error)

  if (error instanceof Error) {
    return createErrorResponse(error.message, defaultStatus)
  }

  return createErrorResponse("Internal server error", defaultStatus)
}

export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")

  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      return null
    }

    return user
  } catch {
    return null
  }
}
