import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { createResponse, handleApiError } from "@/lib/api/utils"

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const category = url.searchParams.get("category")
    const minPrice = url.searchParams.get("minPrice")
    const maxPrice = url.searchParams.get("maxPrice")
    const sort = url.searchParams.get("sort") || "name"
    const order = url.searchParams.get("order") || "asc"
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Base query
    let query = supabaseAdmin.from("products").select(
      `
        *,
        deals!deals_product_id_fkey (
          id,
          title,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          is_active,
          max_uses,
          current_uses
        )
      `,
      { count: "exact" },
    )

    // Apply filters
    if (category) {
      query = query.eq("category", category)
    }

    if (minPrice) {
      query = query.gte("price", minPrice)
    }

    if (maxPrice) {
      query = query.lte("price", maxPrice)
    }

    // Apply sorting
    if (sort === "price") {
      query = query.order("price", { ascending: order === "asc" })
    } else if (sort === "rating") {
      query = query.order("rating", { ascending: order === "asc" })
    } else {
      query = query.order("name", { ascending: order === "asc" })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw error
    }

    // Process products to include deal information
    const now = new Date()
    const productsWithDeals = data.map((product) => {
      // Filter active deals
      const activeDeals = (product.deals || []).filter((deal) => {
        const startDate = new Date(deal.start_date)
        const endDate = new Date(deal.end_date)
        return (
          deal.is_active &&
          now >= startDate &&
          now <= endDate &&
          (deal.max_uses === null || deal.current_uses < deal.max_uses)
        )
      })

      // Find best deal (highest discount)
      let bestDeal = null
      let discountedPrice = product.price

      if (activeDeals.length > 0) {
        bestDeal = activeDeals.reduce((best, current) => {
          const currentDiscount =
            current.discount_type === "percentage"
              ? product.price * (current.discount_value / 100)
              : current.discount_value

          const bestDiscount =
            best.discount_type === "percentage" ? product.price * (best.discount_value / 100) : best.discount_value

          return currentDiscount > bestDiscount ? current : best
        }, activeDeals[0])

        // Calculate discounted price
        if (bestDeal.discount_type === "percentage") {
          discountedPrice = product.price * (1 - bestDeal.discount_value / 100)
        } else {
          discountedPrice = Math.max(0, product.price - bestDeal.discount_value)
        }
      }

      return {
        ...product,
        has_active_deal: activeDeals.length > 0,
        active_deals: activeDeals,
        best_deal: bestDeal,
        discounted_price: discountedPrice,
      }
    })

    return createResponse({
      products: productsWithDeals,
      total: count || 0,
      page,
      limit,
      totalPages: count ? Math.ceil(count / limit) : 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
