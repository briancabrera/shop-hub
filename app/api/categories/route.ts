import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-utils"

// GET /api/categories - Get all unique categories from products
export async function GET(request: NextRequest) {
  try {
    // Get all unique categories from products table
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("category")
      .not("category", "is", null)
      .gt("stock", 0) // Only include categories that have products in stock

    if (error) {
      console.error("Categories API: Database error:", error)
      return errorResponse(error.message, 500)
    }

    // Extract unique categories and format them
    const uniqueCategories = Array.from(new Set(products.map((p) => p.category)))
      .filter(Boolean) // Remove any null/undefined values
      .map((category) => ({
        value: category,
        label: category.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        count: products.filter((p) => p.category === category).length,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))

    console.log("Categories API: Found", uniqueCategories.length, "categories")

    return successResponse(uniqueCategories)
  } catch (error) {
    console.error("Categories API: Error:", error)
    return errorResponse("Failed to fetch categories", 500)
  }
}
