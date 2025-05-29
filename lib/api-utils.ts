import { NextResponse } from "next/server"
import type { ApiResponse } from "@/types/api"
import { ZodError } from "zod"

export function successResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status })
}

export function errorResponse(error: string, status = 400): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status })
}

export function handleZodError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    const errorMessage = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
    return errorResponse(errorMessage, 400)
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 500)
  }

  return errorResponse("An unknown error occurred", 500)
}
