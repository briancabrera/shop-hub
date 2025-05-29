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

    // Build data query with deals information
    let dataQuery = supabaseAdmin.from("products").select(`
        *,
        deals!left(
          id,
          title,
          discount_type,
          discount_value,
          start_date,
          end_date,
          is_active,
          max_uses,
          current_uses
        )
      `)

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
      case "deals-first":
        // Custom sorting to show products with active deals first
        dataQuery = dataQuery.order("created_at", { ascending: false })
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

    // Process products and filter active deals
    const processedProducts = (data || []).map((product) => {
      // Filter only active deals that are currently valid
      const activeDeals = (product.deals || []).filter((deal: any) => {
        if (!deal.is_active) return false

        const now = new Date()
        const startDate = new Date(deal.start_date)
        const endDate = new Date(deal.end_date)

        // Check if deal is within date range
        if (now < startDate || now > endDate) return false

        // Check if deal hasn't exceeded max uses
        if (deal.max_uses && deal.current_uses >= deal.max_uses) return false

        return true
      })

      // Calculate best deal (highest discount)
      let bestDeal = null
      if (activeDeals.length > 0) {
        bestDeal = activeDeals.reduce((best: any, current: any) => {
          const currentDiscount =
            current.discount_type === "percentage"
              ? (product.price * current.discount_value) / 100
              : current.discount_value

          const bestDiscount =
            best.discount_type === "percentage" ? (product.price * best.discount_value) / 100 : best.discount_value

          return currentDiscount > bestDiscount ? current : best
        })
      }

      // Calculate discounted price if there's a deal
      let discountedPrice = null
      if (bestDeal) {
        if (bestDeal.discount_type === "percentage") {
          discountedPrice = product.price * (1 - bestDeal.discount_value / 100)
        } else {
          discountedPrice = Math.max(0, product.price - bestDeal.discount_value)
        }
      }

      return {
        ...product,
        deals: activeDeals,
        best_deal: bestDeal,
        discounted_price: discountedPrice,
        has_active_deal: activeDeals.length > 0,
      }
    })

    // Sort by deals first if requested
    if (filters.sort === "deals-first") {
      processedProducts.sort((a, b) => {
        if (a.has_active_deal && !b.has_active_deal) return -1
        if (!a.has_active_deal && b.has_active_deal) return 1
        return 0
      })
    }

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / filters.limit!)

    return createResponse({
      data: processedProducts,
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
