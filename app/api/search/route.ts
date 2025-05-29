import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-utils"

// GET /api/search - Search products with enhanced text search
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q") || ""
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 20) // Max 20 results for autocomplete
    const categories = searchParams.get("categories")?.split(",").filter(Boolean) || null

    if (!query.trim()) {
      return successResponse({
        results: [],
        total: 0,
        query: "",
        suggestions: [],
      })
    }

    console.log("Search API: Query:", query, "Limit:", limit, "Categories:", categories)

    try {
      // Use basic ILIKE search instead of the function
      const searchTerm = `%${query.trim()}%`

      let searchQuery = supabaseAdmin
        .from("products")
        .select("id, name, description, price, image_url, category, rating, stock")
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
        .gt("stock", 0)

      // Apply category filter if provided
      if (categories && categories.length > 0) {
        searchQuery = searchQuery.in("category", categories)
      }

      const { data: products, error } = await searchQuery.limit(limit)

      if (error) {
        console.error("Search API: Search error:", error)
        return errorResponse(error.message, 500)
      }

      // Process results for search
      const results = (products || []).map((product) => {
        const result = {
          ...product,
          highlight: {} as any,
        }

        // Add highlighting for search terms
        const queryLower = query.toLowerCase()
        if (product.name && product.name.toLowerCase().includes(queryLower)) {
          result.highlight.name = highlightText(product.name, query)
        }

        if (product.description && product.description.toLowerCase().includes(queryLower)) {
          result.highlight.description = highlightText(product.description, query)
        }

        return result
      })

      // Generate search suggestions
      const suggestions = await generateSearchSuggestions(query, categories)

      console.log("Search API: Found", results.length, "results")

      return successResponse({
        results,
        total: results.length,
        query,
        suggestions,
      })
    } catch (error) {
      console.error("Search API: Error:", error)
      return errorResponse("Search failed", 500)
    }
  } catch (error) {
    console.error("Search API: Error:", error)
    return errorResponse("Search failed", 500)
  }
}

// Function to highlight search terms in text
function highlightText(text: string, query: string): string {
  if (!text || !query) return text

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  return text.replace(regex, "<mark>$1</mark>")
}

// Function to generate search suggestions
async function generateSearchSuggestions(query: string, categories: string[] | null): Promise<string[]> {
  try {
    if (query.length < 2) return []

    // Build the query for suggestions
    let suggestionQuery = supabaseAdmin
      .from("products")
      .select("name, category")
      .or(`name.ilike.%${query}%,category.ilike.%${query}%`)

    // Apply category filter if provided
    if (categories && categories.length > 0) {
      suggestionQuery = suggestionQuery.in("category", categories)
    }

    const { data: products } = await suggestionQuery.limit(5)

    const suggestions = new Set<string>()

    products?.forEach((product) => {
      // Add product names that start with the query
      if (product.name && product.name.toLowerCase().startsWith(query.toLowerCase())) {
        suggestions.add(product.name)
      }

      // Add categories
      if (product.category && product.category.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(product.category)
      }
    })

    return Array.from(suggestions).slice(0, 5)
  } catch (error) {
    console.error("Error generating suggestions:", error)
    return []
  }
}
