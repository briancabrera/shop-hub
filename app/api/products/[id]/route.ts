import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-utils"

// GET /api/products/[id] - Get a single product by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const { data, error } = await supabaseAdmin.from("products").select("*").eq("id", id).single()

    if (error) {
      return errorResponse("Product not found", 404)
    }

    return successResponse(data)
  } catch (error) {
    return errorResponse("Failed to fetch product", 500)
  }
}
