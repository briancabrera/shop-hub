import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createResponse, handleApiError } from "@/lib/api/utils"
import type { ProductFilters } from "@/types"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filters: ProductFilters = {
      category: searchParams.get("category") || undefined,
      categories: searchParams.get("categories")?.split(",").filter(Boolean) || undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      sort: searchParams.get("sort") || undefined,
      page: Math.max(1, Number(searchParams.get("page")) || 1),
      limit: Math.min(50, Math.max(1, Number(searchParams.get("limit")) || 12)),
      search: searchParams.get("q") || undefined,
    }

    const offset = (filters.page! - 1) * filters.limit!

    // Build count query
    let countQuery = supabaseAdmin.from("products").select("*", { count: "exact", head: true })

    // Build data query
    let dataQuery = supabaseAdmin.from("products").select("*")

    // Apply filters to both queries
    const applyFilters = (query: any) => {
      if (filters.search) {
        const searchTerm = `%${filters.search.trim()}%`
        query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm}`)
      }

      if (filters.categories?.length) {
        query = query.in("category", filters.categories)
      } else if (filters.category) {
        query = query.eq("category", filters.category)
      }

      if (filters.minPrice !== undefined) {
        query = query.gte("price", filters.minPrice)
      }

      if (filters.maxPrice !== undefined) {
        query = query.lte("price", filters.maxPrice)
      }

      if (filters.minRating !== undefined) {
        query = query.gte("rating", filters.minRating)
      }

      return query
    }

    countQuery = applyFilters(countQuery)
    dataQuery = applyFilters(dataQuery)

    // Apply sorting
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
      default:
        dataQuery = dataQuery.order("created_at", { ascending: false })
    }

    // Apply pagination
    dataQuery = dataQuery.range(offset, offset + filters.limit! - 1)

    // Execute queries
    const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([countQuery, dataQuery])

    if (countError || dataError) {
      throw new Error(countError?.message || dataError?.message || "Database query failed")
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / filters.limit!)

    return createResponse({
      data: data || [],
      pagination: {
        page: filters.page!,
        limit: filters.limit!,
        total: totalCount,
        totalPages,
        hasNext: filters.page! < totalPages,
        hasPrev: filters.page! > 1,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
