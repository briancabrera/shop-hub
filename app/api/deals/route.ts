import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/api/utils"
import type { DealFilters } from "@/types/deals"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters: DealFilters = {
      category: searchParams.get("category") || undefined,
      discount_type: (searchParams.get("discount_type") as "percentage" | "fixed") || undefined,
      min_discount: searchParams.get("min_discount") ? Number(searchParams.get("min_discount")) : undefined,
      max_discount: searchParams.get("max_discount") ? Number(searchParams.get("max_discount")) : undefined,
      active_only: searchParams.get("active_only") === "true",
    }

    let query = supabaseAdmin
      .from("deals")
      .select(`
        *,
        product:products(*)
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (filters.active_only) {
      const now = new Date().toISOString()
      query = query.eq("is_active", true).lte("start_date", now).gte("end_date", now)
    }

    if (filters.discount_type) {
      query = query.eq("discount_type", filters.discount_type)
    }

    if (filters.min_discount !== undefined) {
      query = query.gte("discount_value", filters.min_discount)
    }

    if (filters.max_discount !== undefined) {
      query = query.lte("discount_value", filters.max_discount)
    }

    const { data: deals, error } = await query

    if (error) {
      console.error("Error fetching deals:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch deals" }, { status: 500 })
    }

    // Filter by category if specified (since it's on the product)
    let filteredDeals = deals || []
    if (filters.category) {
      filteredDeals = filteredDeals.filter((deal) => deal.product?.category === filters.category)
    }

    return NextResponse.json({
      success: true,
      data: filteredDeals,
    })
  } catch (error) {
    console.error("Error in deals API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, title, description, discount_type, discount_value, start_date, end_date, max_uses } = body

    // Validate required fields
    if (!product_id || !title || !discount_type || !discount_value || !start_date || !end_date) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate discount type and value
    if (!["percentage", "fixed"].includes(discount_type)) {
      return NextResponse.json({ success: false, error: "Invalid discount type" }, { status: 400 })
    }

    if (discount_value <= 0) {
      return NextResponse.json({ success: false, error: "Discount value must be positive" }, { status: 400 })
    }

    // Validate dates
    const startDate = new Date(start_date)
    const endDate = new Date(end_date)
    if (endDate <= startDate) {
      return NextResponse.json({ success: false, error: "End date must be after start date" }, { status: 400 })
    }

    const { data: deal, error } = await supabaseAdmin
      .from("deals")
      .insert({
        product_id,
        title,
        description,
        discount_type,
        discount_value,
        start_date,
        end_date,
        max_uses,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating deal:", error)
      return NextResponse.json({ success: false, error: "Failed to create deal" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: deal,
    })
  } catch (error) {
    console.error("Error in deals POST API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
