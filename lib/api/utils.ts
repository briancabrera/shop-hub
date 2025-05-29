import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import type { ZodError } from "zod"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export function createResponse<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    } as ApiResponse<T>,
    { status },
  )
}

export function handleApiError(error: unknown, status = 500): NextResponse {
  console.error("API Error:", error)

  let message = "Internal server error"

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === "string") {
    message = error
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
    } as ApiResponse,
    { status },
  )
}

export function handleZodError(error: ZodError): NextResponse {
  const firstError = error.errors[0]
  const message = firstError ? `${firstError.path.join(".")}: ${firstError.message}` : "Validation error"

  return NextResponse.json(
    {
      success: false,
      error: message,
    } as ApiResponse,
    { status: 400 },
  )
}

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      return null
    }

    return user
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}
