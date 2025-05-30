import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { ZodError } from "zod"

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }

    const token = authHeader.substring(7)
    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(token)

    if (error || !user) {
      console.error("Auth error:", error)
      return null
    }

    return user
  } catch (error) {
    console.error("Error in getAuthenticatedUser:", error)
    return null
  }
}

export function createResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  )
}

export function handleApiError(error: unknown, status = 400) {
  console.error("API Error:", error)

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: "Validation error",
        details: error.errors,
      },
      { status },
    )
  }

  let message = "An unexpected error occurred"

  if (error instanceof Error) {
    message = error.message
  } else if (typeof error === "string") {
    message = error
  }

  return NextResponse.json(
    {
      success: false,
      error: message,
    },
    { status },
  )
}
