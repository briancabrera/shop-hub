import type { NextRequest } from "next/server"
import { supabaseAdmin } from "@/lib/db"
import { successResponse, errorResponse } from "@/lib/api-utils"

// GET /api/products/[id] - Get a single product by ID with deal information
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Get product with active deal information
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(`
        *,
        deals!inner(
          id,
          title,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          max_uses,
          current_uses,
          is_active
        )
      `)
      .eq("id", id)
      .eq("deals.is_active", true)
      .gte("deals.end_date", new Date().toISOString())
      .lte("deals.start_date", new Date().toISOString())
      .single()

    // If no product with deal found, try to get product without deal
    if (error && error.code === "PGRST116") {
      const { data: productData, error: productError } = await supabaseAdmin
        .from("products")
        .select("*")
        .eq("id", id)
        .single()

      if (productError) {
        return errorResponse("Product not found", 404)
      }

      return successResponse({
        ...productData,
        has_active_deal: false,
        best_deal: null,
        discounted_price: null,
      })
    }

    if (error) {
      return errorResponse("Product not found", 404)
    }

    // Process deal information
    const product = data
    const deals = Array.isArray(product.deals) ? product.deals : [product.deals]

    // Filter valid deals
    const validDeals = deals.filter((deal) => {
      const now = new Date()
      const startDate = new Date(deal.start_date)
      const endDate = new Date(deal.end_date)

      return (
        deal.is_active &&
        now >= startDate &&
        now <= endDate &&
        (deal.max_uses === null || deal.current_uses < deal.max_uses)
      )
    })

    let bestDeal = null
    let discountedPrice = null

    if (validDeals.length > 0) {
      // Find the best deal (highest discount)
      bestDeal = validDeals.reduce((best, current) => {
        const bestDiscount =
          best.discount_type === "percentage" ? (product.price * best.discount_value) / 100 : best.discount_value

        const currentDiscount =
          current.discount_type === "percentage"
            ? (product.price * current.discount_value) / 100
            : current.discount_value

        return currentDiscount > bestDiscount ? current : best
      })

      // Calculate discounted price
      if (bestDeal.discount_type === "percentage") {
        discountedPrice = product.price * (1 - bestDeal.discount_value / 100)
      } else {
        discountedPrice = Math.max(0, product.price - bestDeal.discount_value)
      }
    }

    // Clean up the response
    const { deals: _, ...productWithoutDeals } = product

    return successResponse({
      ...productWithoutDeals,
      has_active_deal: validDeals.length > 0,
      best_deal: bestDeal,
      discounted_price: discountedPrice,
      savings: bestDeal ? product.price - discountedPrice : 0,
    })
  } catch (error) {
    console.error("Error fetching product:", error)
    return errorResponse("Failed to fetch product", 500)
  }
}
