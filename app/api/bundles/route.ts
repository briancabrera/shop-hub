import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/admin"
import { getAuthenticatedUser } from "@/lib/api/utils"
import type { BundleFilters } from "@/types/deals"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filters: BundleFilters = {
      discount_type: (searchParams.get("discount_type") as "percentage" | "fixed") || undefined,
      min_discount: searchParams.get("min_discount") ? Number(searchParams.get("min_discount")) : undefined,
      max_discount: searchParams.get("max_discount") ? Number(searchParams.get("max_discount")) : undefined,
      active_only: searchParams.get("active_only") === "true",
    }

    let query = supabaseAdmin
      .from("bundles")
      .select(`
        *,
        items:bundle_items(
          *,
          product:products(*)
        )
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

    const { data: bundles, error } = await query

    if (error) {
      console.error("Error fetching bundles:", error)
      return NextResponse.json({ success: false, error: "Failed to fetch bundles" }, { status: 500 })
    }

    // Calculate prices for each bundle
    const bundlesWithPrices = (bundles || []).map((bundle) => {
      const originalPrice =
        bundle.items?.reduce((total, item) => {
          return total + (item.product?.price || 0) * item.quantity
        }, 0) || 0

      const discountedPrice =
        bundle.discount_type === "percentage"
          ? originalPrice * (1 - bundle.discount_value / 100)
          : Math.max(0, originalPrice - bundle.discount_value)

      return {
        ...bundle,
        original_price: originalPrice,
        discounted_price: discountedPrice,
      }
    })

    return NextResponse.json({
      success: true,
      data: bundlesWithPrices,
    })
  } catch (error) {
    console.error("Error in bundles API:", error)
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
    const { title, description, discount_type, discount_value, start_date, end_date, max_uses, image_url, items } = body

    // Validate required fields
    if (!title || !discount_type || !discount_value || !start_date || !end_date || !items?.length) {
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

    // Create bundle in a transaction
    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from("bundles")
      .insert({
        title,
        description,
        discount_type,
        discount_value,
        start_date,
        end_date,
        max_uses,
        image_url,
      })
      .select()
      .single()

    if (bundleError) {
      console.error("Error creating bundle:", bundleError)
      return NextResponse.json({ success: false, error: "Failed to create bundle" }, { status: 500 })
    }

    // Create bundle items
    const bundleItems = items.map((item: any) => ({
      bundle_id: bundle.id,
      product_id: item.product_id,
      quantity: item.quantity,
    }))

    const { error: itemsError } = await supabaseAdmin.from("bundle_items").insert(bundleItems)

    if (itemsError) {
      console.error("Error creating bundle items:", itemsError)
      // Rollback bundle creation
      await supabaseAdmin.from("bundles").delete().eq("id", bundle.id)
      return NextResponse.json({ success: false, error: "Failed to create bundle items" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: bundle,
    })
  } catch (error) {
    console.error("Error in bundles POST API:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
