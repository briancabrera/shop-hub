import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { productSchema } from "@/lib/validations"
import { successResponse, errorResponse, handleZodError } from "@/lib/api-utils"

// GET /api/products - List all products with optional filters and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters = {
      category: searchParams.get("category") || undefined,
      categories: searchParams.get("categories")?.split(",").filter(Boolean) || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      sort: searchParams.get("sort") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 12,
      search: searchParams.get("q") || undefined,
    }

    console.log("API: Received filters:", filters)

    // Validate pagination parameters
    const page = Math.max(1, filters.page)
    const limit = Math.min(Math.max(1, filters.limit), 50) // Max 50 items per page
    const offset = (page - 1) * limit

    let totalCount = 0
    let products = []

    // Use standard filtering with search term
    if (filters.search && filters.search.trim()) {
      console.log("API: Using search for query:", filters.search)

      // Basic search using ILIKE
      const searchTerm = `%${filters.search.trim()}%`

      // Build count query
      let countQuery = supabaseAdmin
        .from("products")
        .select("*", { count: "exact", head: true })
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)

      // Build data query
      let dataQuery = supabaseAdmin
        .from("products")
        .select("*")
        .or(`name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)

      // Apply additional filters
      const applyFilters = (query: any) => {
        if (filters.categories && filters.categories.length > 0) {
          query = query.in("category", filters.categories)
        } else if (filters.category) {
          query = query.eq("category", filters.category)
        }

        if (filters.minPrice !== undefined && filters.minPrice > 0) {
          query = query.gte("price", filters.minPrice)
        }

        if (filters.maxPrice !== undefined && filters.maxPrice < 10000) {
          query = query.lte("price", filters.maxPrice)
        }

        if (filters.minRating !== undefined && filters.minRating > 0) {
          query = query.gte("rating", filters.minRating)
        }

        return query
      }

      countQuery = applyFilters(countQuery)
      dataQuery = applyFilters(dataQuery)

      // Apply sorting
      if (filters.sort) {
        switch (filters.sort) {
          case "price-asc":
            dataQuery = dataQuery.order("price", { ascending: true })
            break
          case "price-desc":
            dataQuery = dataQuery.order("price", { ascending: false })
            break
          case "newest":
            dataQuery = dataQuery.order("created_at", { ascending: false })
            break
          case "rating-desc":
            dataQuery = dataQuery.order("rating", { ascending: false, nullsFirst: false })
            break
          case "name-asc":
            dataQuery = dataQuery.order("name", { ascending: true })
            break
          case "name-desc":
            dataQuery = dataQuery.order("name", { ascending: false })
            break
          default:
            dataQuery = dataQuery.order("created_at", { ascending: false })
        }
      } else {
        dataQuery = dataQuery.order("created_at", { ascending: false })
      }

      // Apply pagination
      dataQuery = dataQuery.range(offset, offset + limit - 1)

      // Execute queries
      const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([countQuery, dataQuery])

      if (countError || dataError) {
        console.error("API: Search error:", countError || dataError)
        return errorResponse((countError || dataError)?.message || "Search failed", 500)
      }

      totalCount = count || 0
      products = data || []
    } else {
      // Use standard filtering when no search term is present
      console.log("API: Using standard filtering (no search term)")

      // Build base query for counting total items
      let countQuery = supabaseAdmin.from("products").select("*", { count: "exact", head: true })

      // Build main query for fetching data
      let dataQuery = supabaseAdmin.from("products").select("*")

      // Apply filters to both queries
      const applyFilters = (query: any) => {
        // Handle multiple categories or single category
        if (filters.categories && filters.categories.length > 0) {
          console.log("API: Filtering by categories:", filters.categories)
          query = query.in("category", filters.categories)
        } else if (filters.category) {
          console.log("API: Filtering by single category:", filters.category)
          query = query.eq("category", filters.category)
        }

        if (filters.minPrice !== undefined && filters.minPrice > 0) {
          console.log("API: Filtering by minPrice:", filters.minPrice)
          query = query.gte("price", filters.minPrice)
        }

        if (filters.maxPrice !== undefined && filters.maxPrice < 10000) {
          console.log("API: Filtering by maxPrice:", filters.maxPrice)
          query = query.lte("price", filters.maxPrice)
        }

        if (filters.minRating !== undefined && filters.minRating > 0) {
          console.log("API: Filtering by minRating:", filters.minRating)
          query = query.gte("rating", filters.minRating)
        }

        return query
      }

      // Apply filters to both queries
      countQuery = applyFilters(countQuery)
      dataQuery = applyFilters(dataQuery)

      // Apply sorting to data query
      if (filters.sort) {
        console.log("API: Sorting by:", filters.sort)
        switch (filters.sort) {
          case "price-asc":
            dataQuery = dataQuery.order("price", { ascending: true })
            break
          case "price-desc":
            dataQuery = dataQuery.order("price", { ascending: false })
            break
          case "newest":
            dataQuery = dataQuery.order("created_at", { ascending: false })
            break
          case "rating-desc":
            dataQuery = dataQuery.order("rating", { ascending: false, nullsFirst: false })
            break
          case "name-asc":
            dataQuery = dataQuery.order("name", { ascending: true })
            break
          case "name-desc":
            dataQuery = dataQuery.order("name", { ascending: false })
            break
          default:
            // Default sorting (relevance) - we'll use created_at for now
            dataQuery = dataQuery.order("created_at", { ascending: false })
        }
      } else {
        // Default sorting
        dataQuery = dataQuery.order("created_at", { ascending: false })
      }

      // Apply pagination to data query
      dataQuery = dataQuery.range(offset, offset + limit - 1)

      // Execute both queries
      const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([countQuery, dataQuery])

      if (countError) {
        console.error("API: Count query error:", countError)
        return errorResponse(countError.message, 500)
      }

      if (dataError) {
        console.error("API: Data query error:", dataError)
        return errorResponse(dataError.message, 500)
      }

      totalCount = count || 0
      products = data || []
    }

    // Process results and format response
    const totalPages = Math.ceil(totalCount / limit)

    const paginationInfo = {
      page,
      limit,
      total: totalCount,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    }

    console.log("API: Returning products:", products.length, "of", totalCount)
    console.log("API: Pagination info:", paginationInfo)

    return successResponse({
      data: products,
      pagination: paginationInfo,
    })
  } catch (error) {
    console.error("API: Error in GET /api/products:", error)
    return handleZodError(error)
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = productSchema.parse(body)

    const { data, error } = await supabaseAdmin.from("products").insert(validatedData).select().single()

    if (error) {
      return errorResponse(error.message, 500)
    }

    return successResponse(data, 201)
  } catch (error) {
    return handleZodError(error)
  }
}
